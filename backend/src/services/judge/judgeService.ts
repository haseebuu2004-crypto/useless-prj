import { JudgeProvider } from "./judgeProvider.js";
import { MockJudgeProvider } from "./mockJudgeProvider.js";
import { localLLMJudgeProvider, LocalLLMJudgeProvider } from "./localLLMJudgeProvider.js";
import { geminiJudgeProvider, GeminiJudgeProvider } from "./geminiJudgeProvider.js";
import { JudgeInput, JudgeVerdict, JudgeStatusResponse } from "./judgeTypes.js";
import { absurdityEngine } from "../absurdity/absurdityEngine.js";

export class JudgeService {
  private mockProvider: MockJudgeProvider;
  private localProvider: LocalLLMJudgeProvider;
  private geminiProvider: GeminiJudgeProvider;

  constructor() {
    this.mockProvider = new MockJudgeProvider();
    this.localProvider = localLLMJudgeProvider;
    this.geminiProvider = geminiJudgeProvider;
  }

  getConfiguredProviderName(): string {
    const aiProvider = (process.env.AI_PROVIDER || "").toLowerCase();
    if (aiProvider) return aiProvider;
    const judgeProvider = (process.env.JUDGE_PROVIDER || "").toLowerCase();
    if (judgeProvider) return judgeProvider;
    return "gemini";
  }

  setAbsurdityMode(enabled: boolean) {
    absurdityEngine.setAbsurdityMode(enabled);
  }

  isAbsurdityModeEnabled(): boolean {
    return absurdityEngine.isAbsurdityModeEnabled();
  }

  async getStatus(): Promise<JudgeStatusResponse> {
    const configured = this.getConfiguredProviderName();
    const absurdity_mode = absurdityEngine.isAbsurdityModeEnabled();

    if (configured === "gemini") {
      const isHealthy = await this.geminiProvider.checkHealth();
      return {
        available: isHealthy,
        provider: "gemini",
        model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
        configuredProvider: "gemini",
        message: isHealthy ? "Hosted Gemini AI Judge online." : "AI JUDGE NOT CONFIGURED: Please configure GEMINI_API_KEY in backend/.env",
        absurdity_mode
      };
    }

    if (configured === "local") {
      const available = await this.localProvider.checkHealth();
      if (available) {
        return {
          available: true,
          provider: "local-llm",
          model: process.env.OLLAMA_MODEL || "llama3.2",
          configuredProvider: "local",
          absurdity_mode
        };
      } else {
        return {
          available: false,
          provider: "mock",
          configuredProvider: "local",
          message: "Local AI unavailable; emergency judicial protocol activated.",
          absurdity_mode
        };
      }
    }

    return {
      available: true,
      provider: "mock",
      configuredProvider: "mock",
      absurdity_mode
    };
  }

  async evaluateCase(input: JudgeInput): Promise<JudgeVerdict> {
    const configured = this.getConfiguredProviderName();
    const absurdityContext = absurdityEngine.evaluate(input);

    let verdict: JudgeVerdict;

    if (configured === "gemini") {
      const isHealthy = await this.geminiProvider.checkHealth();
      if (!isHealthy) {
        if (input.isDemo) {
          verdict = await this.mockProvider.evaluateCase(input);
          verdict.provider = "mock";
          verdict.absurdity_context = absurdityContext;
          if (absurdityContext.absurdity_mode_enabled && absurdityContext.harmless_sentence) {
            verdict.sentence = absurdityContext.harmless_sentence;
          }
          return verdict;
        }
        throw new Error("AI JUDGE NOT CONFIGURED: Please configure GEMINI_API_KEY in backend/.env.");
      }
      verdict = await this.geminiProvider.evaluateCase(input);
      verdict.absurdity_context = absurdityContext;
      if (absurdityContext.absurdity_mode_enabled && absurdityContext.harmless_sentence) {
        verdict.sentence = absurdityContext.harmless_sentence;
      }
      return verdict;
    }


    if (configured === "local") {
      try {
        const isHealthy = await this.localProvider.checkHealth();
        if (isHealthy) {
          verdict = await this.localProvider.evaluateCase(input);
          verdict.absurdity_context = absurdityContext;
          if (absurdityContext.absurdity_mode_enabled && absurdityContext.harmless_sentence) {
            verdict.sentence = absurdityContext.harmless_sentence;
          }
          return verdict;
        } else {
          console.warn("Ollama server health check failed. Falling back to MockJudgeProvider.");
        }
      } catch (err: any) {
        console.warn(`Local LLM provider error ("${err.message}"). Falling back to MockJudgeProvider.`);
      }
    }

    // Mock mode (for automated tests or explicit JUDGE_PROVIDER=mock)
    verdict = await this.mockProvider.evaluateCase(input);
    verdict.provider = "mock";
    verdict.absurdity_context = absurdityContext;

    if (absurdityContext.absurdity_mode_enabled && absurdityContext.harmless_sentence) {
      verdict.sentence = absurdityContext.harmless_sentence;
    }

    if (configured === "local") {
      verdict.fallback_reason = "Local AI unavailable. The Tribunal has activated its emergency judicial reasoning protocol.";
    }
    return verdict;
  }
}

export const judgeService = new JudgeService();
