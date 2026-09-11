import { GoogleGenAI, Type } from "@google/genai";
import { JudgeProvider } from "./judgeProvider.js";
import { 
  JudgeInput, 
  JudgeVerdict, 
  JudgeDecision, 
  EvidenceAssessment, 
  TestimonyAssessment 
} from "./judgeTypes.js";
import { buildJudgePrompt } from "./judgePrompt.js";

export class GeminiJudgeProvider implements JudgeProvider {
  name = "GeminiJudgeProvider";

  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim() || apiKey === "MY_GEMINI_API_KEY" || apiKey === "dummy_key") {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "human-tribunal-backend",
        },
      },
    });
  }

  async checkHealth(): Promise<boolean> {
    return this.getClient() !== null;
  }

  async evaluateCase(input: JudgeInput): Promise<JudgeVerdict> {
    const ai = this.getClient();
    if (!ai) {
      throw new Error("AI JUDGE NOT CONFIGURED: Please configure a valid GEMINI_API_KEY in backend/.env.");
    }

    const promptText = buildJudgePrompt(input);
    const systemPrompt = `You are the HUMAN TRIBUNAL AI JUDGE — an extraordinarily dramatic, theatrical, confident, slightly sarcastic Kerala courtroom magistrate.
Judge the defendant based strictly on the submitted case, initial observations, real camera evidence exhibits, and defendant defense statement.
Return ONLY valid JSON matching this exact structure:
{
  "decision": "GUILTY" | "INNOCENT" | "NOT_GUILTY" | "SUSPICIOUS BUT INCONCLUSIVE" | "COURTROOM CHAOS" | "CASE DISMISSED FOR BEING STUPID",
  "confidence": 0.88,
  "reasoning": ["Observation evaluation", "Defense statement analysis", "Judicial ruling rationale"],
  "evidence_assessment": [{"evidence_id": "...", "assessment": "supports"|"contradicts"|"irrelevant", "weight": 0.8}],
  "testimony_assessment": [{"testimony_id": "...", "credibility": 0.75}],
  "sentence": "Fresh, comical, harmless absurd punishment customized specifically to this case."
}`;

    const candidateModels = [
      process.env.GEMINI_MODEL || "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.7-flash",
      "gemini-3.1-flash-lite"
    ];
    const maxRetries = 5;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const currentModel = candidateModels[(attempt - 1) % candidateModels.length];
      try {
        const timeoutMs = 30000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Gemini AI Judge request timed out after 30 seconds.")), timeoutMs);
        });

        const generatePromise = ai.models.generateContent({
          model: currentModel,
          contents: `${systemPrompt}\n\n${promptText}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                decision: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                reasoning: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                },
                evidence_assessment: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      evidence_id: { type: Type.STRING },
                      assessment: { type: Type.STRING },
                      weight: { type: Type.NUMBER }
                    },
                    required: ["evidence_id", "assessment", "weight"]
                  }
                },
                testimony_assessment: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      testimony_id: { type: Type.STRING },
                      credibility: { type: Type.NUMBER }
                    },
                    required: ["testimony_id", "credibility"]
                  }
                },
                sentence: { type: Type.STRING }
              },
              required: ["decision", "confidence", "reasoning", "sentence"]
            }
          }
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        const jsonStr = response.text?.trim() || "{}";
        const rawVerdict = JSON.parse(jsonStr);
        return this.validateAndNormalizeVerdict(rawVerdict, input, currentModel);
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          let waitMs = 2000 * attempt;
          if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
            waitMs = 3000;
          }
          console.warn(`[GeminiJudgeProvider] Attempt ${attempt}/${maxRetries} (${currentModel}) failed (${err.message}). Retrying in ${Math.round(waitMs / 1000)}s...`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
        break;
      }
    }

    throw new Error(`Gemini AI Judge evaluation failed: ${lastError?.message || "Unknown error"}`);
  }

  public validateAndNormalizeVerdict(raw: any, input: JudgeInput, model: string): JudgeVerdict {
    if (!raw || typeof raw !== "object") {
      throw new Error("Verdict from Gemini AI is not a valid JSON object.");
    }

    const validDecisions: JudgeDecision[] = [
      "GUILTY", 
      "INNOCENT", 
      "NOT_GUILTY", 
      "MISTRIAL", 
      "SUSPICIOUS BUT INCONCLUSIVE", 
      "COURTROOM CHAOS", 
      "CASE DISMISSED FOR BEING STUPID"
    ];
    let decision: JudgeDecision = (raw.decision || "GUILTY").toUpperCase() as JudgeDecision;
    if (!validDecisions.includes(decision)) {
      decision = "SUSPICIOUS BUT INCONCLUSIVE";
    }

    let confidence = Number(raw.confidence);
    if (isNaN(confidence)) confidence = 0.85;
    if (confidence < 0) confidence = 0.0;
    if (confidence > 1) confidence = 1.0;

    let reasoning: string[] = Array.isArray(raw.reasoning) ? raw.reasoning.map((r: any) => String(r)) : [];
    if (reasoning.length === 0) {
      reasoning = ["The tribunal evaluated the docket under real AI jurisdiction."];
    }

    const validEvidenceIds = new Set(input.evidence.map(e => e.id));
    const rawEvidenceAssessments = Array.isArray(raw.evidence_assessment) ? raw.evidence_assessment : [];
    
    const evidence_assessment: EvidenceAssessment[] = rawEvidenceAssessments
      .filter((item: any) => item && typeof item.evidence_id === "string" && validEvidenceIds.has(item.evidence_id))
      .map((item: any) => ({
        evidence_id: item.evidence_id,
        assessment: ["supports", "contradicts", "irrelevant"].includes(item.assessment) ? item.assessment : "irrelevant",
        weight: Math.min(Math.max(Number(item.weight) || 0.5, 0), 1)
      }));

    const validTestimonyIds = new Set(input.testimony.map(t => t.id));
    const rawTestimonyAssessments = Array.isArray(raw.testimony_assessment) ? raw.testimony_assessment : [];

    const testimony_assessment: TestimonyAssessment[] = rawTestimonyAssessments
      .filter((item: any) => item && typeof item.testimony_id === "string" && validTestimonyIds.has(item.testimony_id))
      .map((item: any) => ({
        testimony_id: item.testimony_id,
        credibility: Math.min(Math.max(Number(item.credibility) || 0.5, 0), 1)
      }));

    const sentence = raw.sentence || "Sentenced to fold fitted sheets for eternity.";
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
      provider: "gemini",
      model
    };
  }
}

export const geminiJudgeProvider = new GeminiJudgeProvider();

