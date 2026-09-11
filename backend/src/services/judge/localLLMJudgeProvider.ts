import { JudgeProvider } from "./judgeProvider.js";
import { 
  JudgeInput, 
  JudgeVerdict, 
  JudgeDecision, 
  EvidenceAssessment, 
  TestimonyAssessment 
} from "./judgeTypes.js";
import { buildJudgePrompt } from "./judgePrompt.js";

function getOllamaConfig() {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  return { baseUrl, model };
}

export class LocalLLMJudgeProvider implements JudgeProvider {
  name = "LocalLLMJudgeProvider";

  async checkHealth(): Promise<boolean> {
    const { baseUrl } = getOllamaConfig();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${baseUrl}/api/version`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  async evaluateCase(input: JudgeInput): Promise<JudgeVerdict> {
    const { baseUrl, model } = getOllamaConfig();
    const prompt = buildJudgePrompt(input);

    let rawResponse = "";
    try {
      rawResponse = await this.callOllama(baseUrl, model, prompt);
    } catch (err: any) {
      throw new Error(`Ollama request failed: ${err.message}`);
    }

    let parsedVerdict: any = null;
    try {
      parsedVerdict = this.cleanAndParseJSON(rawResponse);
    } catch (parseErr) {
      // 1 controlled repair retry
      console.warn("Initial Ollama response failed JSON parsing. Attempting 1 repair retry...");
      const repairPrompt = `${prompt}\n\nIMPORTANT: Your previous response was invalid JSON. Reply ONLY with valid JSON matching the exact schema. No markdown formatting.`;
      try {
        const retryResponse = await this.callOllama(baseUrl, model, repairPrompt);
        parsedVerdict = this.cleanAndParseJSON(retryResponse);
      } catch (retryErr: any) {
        throw new Error(`Ollama failed JSON validation after repair retry: ${retryErr.message}`);
      }
    }

    // Anti-Hallucination & Validation Pipeline
    return this.validateAndNormalizeVerdict(parsedVerdict, input, model);
  }

  private async callOllama(baseUrl: string, model: string, prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for local LLM inference

    try {
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: "json"
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Ollama returned HTTP ${res.status}: ${res.statusText}`);
      }

      const data: any = await res.json();
      if (!data.response) {
        throw new Error("Ollama returned an empty response.");
      }
      return data.response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  cleanAndParseJSON(raw: string): any {
    let cleaned = raw.trim();
    // Remove markdown ```json wrappers if present
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    }
    return JSON.parse(cleaned);
  }

  validateAndNormalizeVerdict(raw: any, input: JudgeInput, model: string): JudgeVerdict {
    if (!raw || typeof raw !== "object") {
      throw new Error("Verdict is not a valid JSON object.");
    }

    // 1. Decision Validation
    const validDecisions: JudgeDecision[] = ["GUILTY", "NOT_GUILTY", "MISTRIAL"];
    let decision: JudgeDecision = (raw.decision || "").toUpperCase();
    if (!validDecisions.includes(decision)) {
      throw new Error(`Invalid decision '${raw.decision}'. Must be GUILTY, NOT_GUILTY, or MISTRIAL.`);
    }

    // 2. Confidence Validation & Clamping [0.0, 1.0]
    let confidence = Number(raw.confidence);
    if (isNaN(confidence)) confidence = 0.75;
    if (confidence < 0) confidence = 0.0;
    if (confidence > 1) confidence = 1.0;

    // 3. Reasoning Array Validation
    let reasoning: string[] = Array.isArray(raw.reasoning) ? raw.reasoning.map((r: any) => String(r)) : [];
    if (reasoning.length === 0) {
      reasoning = ["The tribunal evaluated the docket under local AI jurisdiction."];
    }

    // 4. Anti-Hallucination: Evidence ID Verification
    const validEvidenceIds = new Set(input.evidence.map(e => e.id));
    const rawEvidenceAssessments = Array.isArray(raw.evidence_assessment) ? raw.evidence_assessment : [];
    
    const evidence_assessment: EvidenceAssessment[] = rawEvidenceAssessments
      .filter((item: any) => item && typeof item.evidence_id === "string" && validEvidenceIds.has(item.evidence_id))
      .map((item: any) => {
        let assessment: "supports" | "contradicts" | "irrelevant" = "irrelevant";
        if (["supports", "contradicts", "irrelevant"].includes(item.assessment)) {
          assessment = item.assessment;
        }
        let weight = Number(item.weight);
        if (isNaN(weight) || weight < 0) weight = 0.5;
        if (weight > 1) weight = 1.0;

        return {
          evidence_id: item.evidence_id,
          assessment,
          weight
        };
      });

    // 5. Anti-Hallucination: Testimony ID Verification
    const validTestimonyIds = new Set(input.testimony.map(t => t.id));
    const rawTestimonyAssessments = Array.isArray(raw.testimony_assessment) ? raw.testimony_assessment : [];

    const testimony_assessment: TestimonyAssessment[] = rawTestimonyAssessments
      .filter((item: any) => item && typeof item.testimony_id === "string" && validTestimonyIds.has(item.testimony_id))
      .map((item: any) => {
        let credibility = Number(item.credibility);
        if (isNaN(credibility) || credibility < 0) credibility = 0.5;
        if (credibility > 1) credibility = 1.0;

        return {
          testimony_id: item.testimony_id,
          credibility
        };
      });

    const sentence = raw.sentence || "Sentenced to review code reviews with zero context for 5 consecutive days.";
    const caseNumber = `CASE NO. ${Math.floor(Math.random() * 8999 + 1000)}-HT`;
    const charges = input.case_data?.action || "Alleged Violation of Reasonable Behavior";

    return {
      decision,
      confidence,
      reasoning,
      evidence_assessment,
      testimony_assessment,
      sentence,
      charges,
      caseNumber,
      timestamp: new Date().toISOString(),
      provider: "local-llm",
      model
    };
  }
}

export const localLLMJudgeProvider = new LocalLLMJudgeProvider();
