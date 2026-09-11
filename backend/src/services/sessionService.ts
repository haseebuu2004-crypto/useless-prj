import crypto from "crypto";
import { 
  TribunalSession, 
  TribunalStatus, 
  CaseData, 
  TestimonyItem 
} from "../models/session.js";
import { EvidenceItem, CreateEvidenceInput } from "./evidence/evidenceTypes.js";
import { createEvidenceItem } from "./evidence/evidenceService.js";
import { judgeService } from "./judge/judgeService.js";
import { JudgeInput } from "./judge/judgeTypes.js";

export const sessions: Record<string, TribunalSession> = {};

const VALID_TRANSITIONS: Record<TribunalStatus, TribunalStatus[]> = {
  LOBBY: ["CASE_FILED"],
  CASE_FILED: ["EVIDENCE"],
  EVIDENCE: ["EVIDENCE", "TESTIMONY"],
  TESTIMONY: ["TESTIMONY", "DELIBERATION"],
  DELIBERATION: ["VERDICT"],
  VERDICT: ["CLOSED"],
  CLOSED: ["LOBBY"]
};

export function validateStateTransition(current: TribunalStatus, target: TribunalStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false;
}

export function createSession(): TribunalSession {
  const sessionId = "HT-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  const session: TribunalSession = {
    session_id: sessionId,
    status: "LOBBY",
    created_at: new Date().toISOString(),
    evidence: [],
    testimony: []
  };
  sessions[sessionId] = session;
  return session;
}

export function getSessionById(sessionId: string): TribunalSession | null {
  return sessions[sessionId] || null;
}

export function submitCaseData(sessionId: string, data: CaseData): TribunalSession {
  const session = sessions[sessionId];
  if (!session) throw new Error("Session not found");
  if (!validateStateTransition(session.status, "CASE_FILED")) {
    throw new Error(`Invalid transition from state '${session.status}' to 'CASE_FILED'`);
  }
  session.case_data = data;
  session.status = "CASE_FILED";
  return session;
}

export function addEvidenceToSession(sessionId: string, input: CreateEvidenceInput): { session: TribunalSession; evidence: EvidenceItem } {
  const session = sessions[sessionId];
  if (!session) throw new Error("Session not found");

  if (session.status === "CLOSED") {
    throw new Error("Cannot add evidence to a CLOSED tribunal session.");
  }
  
  if (!validateStateTransition(session.status, "EVIDENCE")) {
    throw new Error(`Invalid transition from state '${session.status}' to 'EVIDENCE'`);
  }
  
  const exhibitIndex = session.evidence.length;
  const newItem = createEvidenceItem(input, exhibitIndex);
  
  session.evidence.push(newItem);
  session.status = "EVIDENCE";

  return { session, evidence: newItem };
}

export function getEvidenceListForSession(sessionId: string): EvidenceItem[] {
  const session = sessions[sessionId];
  if (!session) throw new Error("Session not found");
  return session.evidence;
}

export function getEvidenceItemForSession(sessionId: string, evidenceId: string): EvidenceItem {
  const session = sessions[sessionId];
  if (!session) throw new Error("Session not found");
  const item = session.evidence.find(e => e.id === evidenceId);
  if (!item) throw new Error(`Evidence item '${evidenceId}' not found in session.`);
  return item;
}

export function deleteEvidenceFromSession(sessionId: string, evidenceId: string): { session: TribunalSession; deletedId: string } {
  const session = sessions[sessionId];
  if (!session) throw new Error("Session not found");

  if (session.status === "CLOSED") {
    throw new Error("Cannot delete evidence from a CLOSED tribunal session.");
  }

  const index = session.evidence.findIndex(e => e.id === evidenceId);
  if (index === -1) {
    throw new Error(`Evidence item '${evidenceId}' not found in session.`);
  }

  session.evidence.splice(index, 1);
  
  // Re-index exhibit numbers
  session.evidence.forEach((item, idx) => {
    let letter = "";
    let n = idx;
    while (n >= 0) {
      letter = String.fromCharCode((n % 26) + 65) + letter;
      n = Math.floor(n / 26) - 1;
    }
    item.exhibit_number = `EXHIBIT ${letter}`;
  });

  return { session, deletedId: evidenceId };
}

export function addTestimonyItem(sessionId: string, item: { witness: string; statement: string }): TribunalSession {
  const session = sessions[sessionId];
  if (!session) throw new Error("Session not found");

  if (!validateStateTransition(session.status, "TESTIMONY")) {
    throw new Error(`Invalid transition from state '${session.status}' to 'TESTIMONY'`);
  }

  const newTestimony: TestimonyItem = {
    id: "TST-" + crypto.randomBytes(2).toString("hex").toUpperCase(),
    witness: item.witness,
    statement: item.statement,
    timestamp: new Date().toISOString()
  };
  session.testimony.push(newTestimony);
  session.status = "TESTIMONY";
  return session;
}

export async function startDeliberating(sessionId: string): Promise<TribunalSession> {
  const session = sessions[sessionId];
  if (!session) throw new Error("Session not found");
  if (!validateStateTransition(session.status, "DELIBERATION")) {
    throw new Error(`Invalid transition from state '${session.status}' to 'DELIBERATION'`);
  }

  const judgeInput: JudgeInput = {
    case_data: session.case_data,
    evidence: session.evidence,
    testimony: session.testimony,
    isDemo: Boolean(session.isDemo),
  };

  const verdict = await judgeService.evaluateCase(judgeInput);
  session.verdict = verdict;
  session.status = "DELIBERATION";
  return session;
}

export function generateSessionVerdict(sessionId: string): TribunalSession {
  const session = sessions[sessionId];
  if (!session) throw new Error("Session not found");
  if (!validateStateTransition(session.status, "VERDICT")) {
    throw new Error(`Invalid transition from state '${session.status}' to 'VERDICT'`);
  }

  if (!session.verdict) {
    throw new Error("Deliberation verdict missing. Run deliberation first.");
  }

  session.status = "VERDICT";
  return session;
}

export function closeTribunalSession(sessionId: string): TribunalSession {
  const session = sessions[sessionId];
  if (!session) throw new Error("Session not found");
  if (!validateStateTransition(session.status, "CLOSED")) {
    throw new Error(`Invalid transition from state '${session.status}' to 'CLOSED'`);
  }
  session.status = "CLOSED";
  return session;
}
