export type TribunalStatus = 
  | "LOBBY"
  | "CASE_FILED"
  | "EVIDENCE"
  | "TESTIMONY"
  | "DELIBERATION"
  | "VERDICT"
  | "CLOSED";

export type JudgeDecision = 
  | "GUILTY" 
  | "INNOCENT" 
  | "NOT_GUILTY"
  | "MISTRIAL"
  | "SUSPICIOUS BUT INCONCLUSIVE" 
  | "COURTROOM CHAOS" 
  | "CASE DISMISSED FOR BEING STUPID";

export type EvidenceType = "TEXT" | "IMAGE" | "VIDEO" | "TESTIMONY" | "OBSERVATION" | "GESTURE";
export type EvidenceSource = "USER" | "SYSTEM" | "CAMERA" | "JUDGE";

export interface EvidenceItem {
  id: string;
  exhibit_number: string;
  type: EvidenceType;
  title: string;
  description: string;
  content?: string;
  source: EvidenceSource;
  relevance: number;
  credibility: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface CreateEvidenceInput {
  type: EvidenceType;
  title: string;
  description: string;
  content?: string;
  source?: EvidenceSource;
  metadata?: Record<string, any>;
}

export interface EvidenceAssessment {
  evidence_id: string;
  assessment: "supports" | "contradicts" | "irrelevant";
  weight: number;
}

export interface TestimonyAssessment {
  testimony_id: string;
  credibility: number;
}

export interface TestimonyItem {
  id: string;
  witness: string;
  statement: string;
  timestamp: string;
}

export interface CaseSubmission {
  title: string;
  action: string;
  reason: string;
  defense_prompt?: string;
  manglish_reaction?: string;
}

export interface AbsurdityContext {
  offense_type: string;
  offense_label: string;
  suspicion_score: number;
  suspicion_percentage: number;
  classification: string;
  courtroom_interpretation: string;
  court_comment: string;
  harmless_sentence: string;
  absurdity_mode_enabled: boolean;
}

export interface Verdict {
  caseNumber: string;
  charges: string;
  reasoning: string | string[];
  finalVerdict: string;
  sentence: string;
  decision?: JudgeDecision;
  confidence?: number;
  evidence_assessment?: EvidenceAssessment[];
  testimony_assessment?: TestimonyAssessment[];
  provider?: "mock" | "local-llm";
  model?: string;
  fallback_reason?: string;
  absurdity_context?: AbsurdityContext;
}

export interface JudgeStatusResponse {
  available: boolean;
  provider: "mock" | "local-llm";
  model?: string;
  configuredProvider: string;
  message?: string;
  absurdity_mode?: boolean;
}

export interface FullCase extends Verdict {
  originalTitle: string;
  originalAction: string;
  originalReason: string;
  timestamp: string;
}

export interface TribunalSession {
  session_id: string;
  status: TribunalStatus;
  created_at: string;
  case_data?: CaseSubmission;
  evidence: EvidenceItem[];
  testimony: TestimonyItem[];
  verdict?: Verdict;
}

export type ViewState = "home" | "submit" | "evidence" | "testimony" | "deliberating" | "verdict" | "closed" | "recent-cases";
