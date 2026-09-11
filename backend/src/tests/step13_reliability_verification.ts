import { 
  createSession, 
  getSessionById, 
  submitCaseData, 
  addEvidenceToSession, 
  addTestimonyItem, 
  startDeliberating, 
  generateSessionVerdict, 
  closeTribunalSession 
} from "../services/sessionService.js";
import { validateEvidenceInput, createEvidenceItem } from "../services/evidence/evidenceService.js";
import { judgeService } from "../services/judge/judgeService.js";
import { absurdityEngine } from "../services/absurdity/absurdityEngine.js";

async function runStep13Verification() {
  process.env.AI_PROVIDER = "mock";
  console.log("==================================================");
  console.log("  STEP 13 — RELIABILITY & SECURITY VERIFICATION   ");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assertTest(name: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      console.log(`✓ TEST ${total}: ${name}`);
      passed++;
    } else {
      console.error(`✗ TEST ${total} FAILED: ${name}`);
      if (detail) console.error(`   Details: ${detail}`);
    }
  }

  // 1. Backend health & setup
  try {
    const status = await judgeService.getStatus();
    assertTest("Backend & JudgeService health check", status.available === true);
  } catch (err: any) {
    assertTest("Backend & JudgeService health check", false, err.message);
  }

  // 2. Session creation
  let session = createSession();
  assertTest("Session creation initializes in LOBBY state", session.status === "LOBBY" && session.session_id.startsWith("HT-"));

  // 3. Invalid session transition rejected (LOBBY -> VERDICT must fail)
  try {
    generateSessionVerdict(session.session_id);
    assertTest("Illegal transition LOBBY -> VERDICT rejected", false, "Should have thrown an error");
  } catch (err: any) {
    assertTest("Illegal transition LOBBY -> VERDICT rejected", err.message.includes("Invalid transition"));
  }

  // 4. Invalid evidence rejected
  try {
    validateEvidenceInput({ type: "INVALID_TYPE" as any, title: "Test", description: "Test" });
    assertTest("Invalid evidence type rejected", false, "Should have thrown invalid type error");
  } catch (err: any) {
    assertTest("Invalid evidence type rejected", err.message.includes("Invalid or missing evidence type"));
  }

  // 5. Empty evidence rejected
  try {
    validateEvidenceInput({ type: "TEXT", title: "   ", description: "   " });
    assertTest("Empty evidence title/description rejected", false, "Should have thrown empty title error");
  } catch (err: any) {
    assertTest("Empty evidence title/description rejected", err.message.includes("required and cannot be empty"));
  }

  // 6. Closed session modification rejected
  let tempSession = createSession();
  submitCaseData(tempSession.session_id, { title: "Close Test", action: "Test", reason: "Test" });
  addEvidenceToSession(tempSession.session_id, { type: "TEXT", title: "Doc", description: "Doc" });
  addTestimonyItem(tempSession.session_id, { witness: "W1", statement: "S1" });
  await startDeliberating(tempSession.session_id);
  generateSessionVerdict(tempSession.session_id);
  closeTribunalSession(tempSession.session_id);

  try {
    addEvidenceToSession(tempSession.session_id, { type: "TEXT", title: "Late Exhibit", description: "Too late" });
    assertTest("Closed session modification rejected", false, "Should not allow adding evidence to closed session");
  } catch (err: any) {
    assertTest("Closed session modification rejected", err.message.includes("CLOSED"));
  }

  // 7. Duplicate / illegal operations handled safely (CLOSED -> DELIBERATION must fail)
  try {
    await startDeliberating(tempSession.session_id);
    assertTest("Closed session deliberation rejected", false, "Should not allow deliberating closed session");
  } catch (err: any) {
    assertTest("Closed session deliberation rejected", err.message.includes("Invalid transition"));
  }

  // 8. Mock judge works
  const mockInput = {
    case_data: { title: "The Microwave Alarm", action: "Left microwave at 0:01", reason: "Lazy" },
    evidence: [createEvidenceItem({ type: "TEXT", title: "Timer Display", description: "0:01 remaining" }, 0)],
    testimony: [{ id: "T1", witness: "Coworker", statement: "It beeped once.", timestamp: new Date().toISOString() }]
  };
  const mockVerdict = await judgeService.evaluateCase(mockInput);
  const validDecisions = ["GUILTY", "INNOCENT", "NOT_GUILTY", "MISTRIAL", "SUSPICIOUS BUT INCONCLUSIVE", "COURTROOM CHAOS", "CASE DISMISSED FOR BEING STUPID"];
  assertTest("Mock judge generates valid verdict", validDecisions.includes(mockVerdict.decision) && mockVerdict.confidence > 0);

  // 9. Invalid judge output falls back safely
  delete process.env.AI_PROVIDER;
  process.env.JUDGE_PROVIDER = "local";
  process.env.OLLAMA_BASE_URL = "http://localhost:99999"; // invalid port to trigger fallback
  const fallbackVerdict = await judgeService.evaluateCase(mockInput);
  assertTest("Invalid/offline local LLM falls back cleanly to Mock judge", fallbackVerdict.provider === "mock" && !!fallbackVerdict.fallback_reason);
  process.env.AI_PROVIDER = "mock"; // restore

  // 10. Absurdity engine remains deterministic
  const eval1 = absurdityEngine.evaluate(mockInput);
  const eval2 = absurdityEngine.evaluate(mockInput);
  assertTest(
    "Absurdity Engine is 100% deterministic (no Math.random)",
    eval1.suspicion_score === eval2.suspicion_score && eval1.classification === eval2.classification && eval1.offense_type === eval2.offense_type
  );

  // 11. Demo mode backend flow remains valid
  const demoSession = createSession();
  submitCaseData(demoSession.session_id, {
    title: "THE MIDNIGHT CAKE INCIDENT",
    action: "Consumed final cake slice at 3:00 AM.",
    reason: "Hunger."
  });
  addEvidenceToSession(demoSession.session_id, {
    type: "TEXT",
    title: "Empty Cake Container",
    description: "Glass container found empty.",
    source: "USER"
  });
  assertTest("Demo mode session bootstraps cleanly", demoSession.status === "EVIDENCE" && demoSession.evidence.length === 1);

  // 12. Camera / mock evidence remains distinguishable
  const realCamEv = createEvidenceItem({
    type: "GESTURE",
    title: "Raised Right Hand",
    description: "Camera observation",
    source: "CAMERA",
    metadata: { detector: "MediaPipe", event: "RIGHT_HAND_RAISED", confidence: 0.95 }
  }, 0);

  const mockCamEv = createEvidenceItem({
    type: "GESTURE",
    title: "[SIMULATED CAMERA] Raised Right Hand",
    description: "Simulated observation for demo mode",
    source: "CAMERA",
    metadata: { detector: "SimulatedDetector", event: "RIGHT_HAND_RAISED", confidence: 0.90, simulated: true }
  }, 1);

  assertTest(
    "Camera and simulated camera evidence remain clearly distinguishable via metadata",
    realCamEv.metadata?.simulated !== true && mockCamEv.metadata?.simulated === true
  );

  // 13. Malformed / missing session handling
  const nullSession = getSessionById("NON_EXISTENT_SESSION_ID");
  assertTest("Missing session returns null safely", nullSession === null);

  // 14. Valid complete tribunal end-to-end flow works
  let fullFlowSession = createSession();
  submitCaseData(fullFlowSession.session_id, { title: "Complete Case", action: "Tested all steps", reason: "Audit requirement" });
  addEvidenceToSession(fullFlowSession.session_id, { type: "TEXT", title: "Log File", description: "Audit logs" });
  addTestimonyItem(fullFlowSession.session_id, { witness: "Auditor", statement: "System is operational." });
  await startDeliberating(fullFlowSession.session_id);
  generateSessionVerdict(fullFlowSession.session_id);
  const finalClosed = closeTribunalSession(fullFlowSession.session_id);
  assertTest("Complete tribunal lifecycle from LOBBY to CLOSED succeeds", finalClosed.status === "CLOSED" && !!finalClosed.verdict);

  console.log("\n==================================================");
  console.log(`  RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log("==================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runStep13Verification().catch(err => {
  console.error("Step 13 verification suite crashed:", err);
  process.exit(1);
});
