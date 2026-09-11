import { EvidenceItem } from "../evidence/evidenceTypes.js";
import { AbsurdityContext } from "../absurdity/absurdityTypes.js";

export type JudgeDecision = 
  | "GUILTY" 
  | "INNOCENT" 
  | "NOT_GUILTY"
  | "MISTRIAL"
  | "SUSPICIOUS BUT INCONCLUSIVE" 
  | "COURTROOM CHAOS" 
  | "CASE DISMISSED FOR BEING STUPID";

export interface EvidenceAssessment {
  evidence_id: string;
  assessment: "supports" | "contradicts" | "irrelevant";
  weight: number;
}

export interface TestimonyAssessment {
  testimony_id: string;
  credibility: number;
}

export interface JudgeInput {
  case_data?: {
    title: string;
    action: string;
    reason: string;
  };
  evidence: EvidenceItem[];
  testimony: Array<{
    id: string;
    witness: string;
    statement: string;
  }>;
  isDemo?: boolean;
}

export interface JudgeVerdict {
  decision: JudgeDecision;
  confidence: number;
  reasoning: string[];
  evidence_assessment: EvidenceAssessment[];
  testimony_assessment: TestimonyAssessment[];
  sentence: string;
  judge_note?: string;
  verdict_line?: string;
  charges: string;
  caseNumber: string;
  timestamp: string;
  provider: "mock" | "local-llm" | "gemini";
  model?: string;
  fallback_reason?: string;
  absurdity_context?: AbsurdityContext;
}

export interface JudgeStatusResponse {
  available: boolean;
  provider: "mock" | "local-llm" | "gemini";
  model?: string;
  configuredProvider: string;
  message?: string;
  absurdity_mode?: boolean;
}
