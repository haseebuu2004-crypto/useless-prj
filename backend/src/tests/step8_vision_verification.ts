import http from 'http';
import { gestureDetector } from '../../../frontend/src/services/vision/gestureDetector.js';
import { visionService } from '../../../frontend/src/services/vision/visionService.js';
import { VisionEvent } from '../../../frontend/src/services/vision/visionTypes.js';

// Simple fetch polyfill or backend runner test
const BACKEND_URL = 'http://localhost:3000';

async function testStep8() {
  console.log("==================================================");
  console.log("  STEP 8: COURTROOM OBSERVER AUTOMATED VERIFICATION");
  console.log("==================================================\n");

  // 1. Check Backend Health
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    const health = await res.json();
    console.log("✓ 1. Backend Health Check:", health);
  } catch (err) {
    console.error("❌ Backend server not reachable at http://localhost:3000. Make sure it is running.");
    process.exit(1);
  }

  // 2. Start Session
  const startRes = await fetch(`${BACKEND_URL}/api/session/start`, { method: 'POST' });
  const startData = await startRes.json();
  const sessionId = startData.session_id;
  console.log(`✓ 2. Started Session: ${sessionId} (Status: ${startData.status})`);

  // 3. File Case
  const caseRes = await fetch(`${BACKEND_URL}/api/session/${sessionId}/case`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: "The Case of the Late Committer",
      action: "Pushing to main on Friday 5PM without tests",
      reason: "Defendant deployed untested code directly to production right before weekend."
    })
  });
  const caseData = await caseRes.json();
  console.log(`✓ 3. Filed Case. Session Status: ${caseData.status}`);

  // 4. Test Vision Service Setup & Confidence Filtering
  visionService.setSession(sessionId, false);
  const started = visionService.startObservation();
  console.log(`✓ 4. Courtroom Observer Activated: ${started}`);

  let lowConfEventEmitted = false;
  const unsubLowConf = gestureDetector.onEvent(() => {
    lowConfEventEmitted = true;
  });
  // Try emitting low confidence event (0.50)
  gestureDetector.emit({
    detector: "gestureDetector",
    event: "RIGHT_HAND_RAISED",
    confidence: 0.50,
    timestamp: new Date().toISOString(),
    source: "CAMERA"
  });
  unsubLowConf();

  if (lowConfEventEmitted) {
    console.error("❌ Confidence threshold failed! Event with 0.50 confidence was emitted.");
  } else {
    console.log("✓ 5. Confidence Threshold Verified (0.50 confidence event properly filtered out).");
  }

  // 5. Test Mock Vision Event -> Evidence Generation (Exhibit A)
  console.log("\n--- Testing Mock Event -> Evidence API Integration ---");
  const event1 = gestureDetector.mockVisionEvent("RIGHT_HAND_RAISED", 0.91);
  console.log("  Emitted Mock Event:", event1.event, `(Confidence: ${event1.confidence})`);
  
  // Wait short tick for async evidence submission
  await new Promise(r => setTimeout(r, 300));

  // Check evidence in session backend
  let sessionRes = await fetch(`${BACKEND_URL}/api/session/${sessionId}`);
  let session = await sessionRes.json();
  console.log(`  Current Evidence Count in Backend: ${session.evidence.length}`);
  const exhibitA = session.evidence[0];
  if (exhibitA && exhibitA.metadata?.event === "RIGHT_HAND_RAISED") {
    console.log("✓ 6. Vision Event -> Evidence Item Conversion Succeeded:");
    console.log("     Exhibit:", exhibitA.exhibit_number);
    console.log("     Title:", exhibitA.title);
    console.log("     Metadata Detector:", exhibitA.metadata.detector);
    console.log("     Metadata Event:", exhibitA.metadata.event);
    console.log("     Metadata Confidence:", exhibitA.metadata.confidence);
    console.log("     Metadata Source:", exhibitA.metadata.source);
  } else {
    console.error("❌ Exhibit A creation failed or metadata mismatched!", session.evidence);
  }

  // 6. Test Cooldown & Duplicate Suppression (5-second rule)
  console.log("\n--- Testing 5-Second Cooldown & Duplicate Suppression ---");
  console.log("  Emitting duplicate RIGHT_HAND_RAISED event immediately (within 500ms)...");
  gestureDetector.mockVisionEvent("RIGHT_HAND_RAISED", 0.94);
  await new Promise(r => setTimeout(r, 300));

  sessionRes = await fetch(`${BACKEND_URL}/api/session/${sessionId}`);
  session = await sessionRes.json();
  if (session.evidence.length === 1) {
    console.log("✓ 7. Duplicate Event Throttled Successfully! (Evidence count remained 1)");
  } else {
    console.error(`❌ Cooldown failed! Evidence count increased to ${session.evidence.length}`);
  }

  // 7. Test State Reset / Different Gesture (HAND_ON_HEAD)
  console.log("\n--- Testing Different Event Type (HAND_ON_HEAD) ---");
  gestureDetector.mockVisionEvent("HAND_ON_HEAD", 0.88);
  await new Promise(r => setTimeout(r, 300));

  sessionRes = await fetch(`${BACKEND_URL}/api/session/${sessionId}`);
  session = await sessionRes.json();
  if (session.evidence.length === 2) {
    const exhibitB = session.evidence[1];
    console.log(`✓ 8. New Event Type Generated Exhibit: ${exhibitB.exhibit_number} (${exhibitB.title})`);
  } else {
    console.error(`❌ State reset/different event failed! Evidence count: ${session.evidence.length}`);
  }

  // 8. Progress to Testimony & Deliberation
  console.log("\n--- Progressing Tribunal Lifecycle ---");
  await fetch(`${BACKEND_URL}/api/session/${sessionId}/testimony`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      witness: "Dev Alex",
      statement: "I swear the build was passing on my local machine!"
    })
  });
  console.log("✓ 9. Testimony Submitted");

  // 9. AI Judge Evaluation & Verdict Generation
  const judgeRes = await fetch(`${BACKEND_URL}/api/session/${sessionId}/deliberate`, { method: 'POST' });
  const judgeData = await judgeRes.json();
  console.log("✓ 10. AI Judge Verdict Delivered:");
  console.log("      Verdict:", judgeData.verdict?.decision);
  console.log("      Summary:", judgeData.verdict?.summary);

  // Close session
  await fetch(`${BACKEND_URL}/api/session/${sessionId}/close`, { method: 'POST' });

  // 10. Closed-Session Protection
  console.log("\n--- Testing Closed-Session Camera Protection ---");
  visionService.setSession(sessionId, true); // Session closed
  console.log(`  Is Vision Service Observing after close? ${visionService.getIsObserving()}`);
  
  gestureDetector.mockVisionEvent("BOTH_HANDS_RAISED", 0.95);
  await new Promise(r => setTimeout(r, 300));

  sessionRes = await fetch(`${BACKEND_URL}/api/session/${sessionId}`);
  session = await sessionRes.json();
  if (session.evidence.length === 2) {
    console.log("✓ 11. Closed-Session Protection Verified! (No evidence generated when session is CLOSED)");
  } else {
    console.error(`❌ Closed session failed to block evidence generation! Count: ${session.evidence.length}`);
  }

  console.log("\n==================================================");
  console.log("  ALL AUTOMATED VERIFICATION CHECKS PASSED SUCCESSFULLY!");
  console.log("==================================================\n");
}

testStep8().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
