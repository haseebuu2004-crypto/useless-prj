import { JudgeVerdict } from "../services/judge/judgeTypes.js";
import { EvidenceItem } from "../services/evidence/evidenceTypes.js";

export type TribunalStatus = 
  | "LOBBY"
  | "CASE_FILED"
  | "EVIDENCE"
  | "TESTIMONY"
  | "DELIBERATION"
  | "VERDICT"
  | "CLOSED";

export interface TestimonyItem {
  id: string;
  witness: string;
  statement: string;
  timestamp: string;
}

export interface CaseData {
  title: string;
  action: string;
  reason: string;
  defense_prompt?: string;
  manglish_reaction?: string;
}

export interface TribunalSession {
  session_id: string;
  status: TribunalStatus;
  created_at: string;
  case_data?: CaseData;
  evidence: EvidenceItem[];
  testimony: TestimonyItem[];
  verdict?: JudgeVerdict;
  isDemo?: boolean;
}
