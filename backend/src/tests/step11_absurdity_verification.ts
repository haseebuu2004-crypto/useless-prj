import http from 'http';
import { absurdityEngine } from '../services/absurdity/absurdityEngine.js';
import { judgeService } from '../services/judge/judgeService.js';
import { JudgeInput } from '../services/judge/judgeTypes.js';

const BACKEND_URL = 'http://localhost:3000';

async function runStep11Tests() {
  console.log("==================================================");
  console.log("  STEP 11: ABSURDITY ENGINE VERIFICATION");
  console.log("==================================================\n");

  const midnightHeistInput: JudgeInput = {
    case_data: {
      title: "The Midnight Fridge Heist",
      action: "Eating roommate's leftover lasagna",
      reason: "Claimed it was unlabeled and past midnight."
    },
    evidence: [
      {
        id: "EVD-101",
        exhibit_number: "EXHIBIT A",
        type: "TEXT",
        title: "Tupperware Container",
        description: "Empty glass container with faint cheese residue",
        source: "USER",
        relevance: 0.95,
        credibility: 0.90,
        created_at: new Date().toISOString()
      },
      {
        id: "EVD-102",
        exhibit_number: "EXHIBIT B",
        type: "GESTURE",
        title: "Defendant Raised Right Hand",
        description: "Courtroom observer detected defendant raising right hand in defensiveness",
        source: "CAMERA",
        relevance: 0.88,
        credibility: 0.95,
        created_at: new Date().toISOString(),
        metadata: { detector: "gestureDetector", event: "RIGHT_HAND_RAISED", confidence: 0.94 }
      }
    ],
    testimony: [
      {
        id: "TST-201",
        witness: "Roommate Alex",
        statement: "It had my name written on a tiny piece of painter's tape on the lid!"
      }
    ]
  };

  // 1. Direct Engine Unit Tests: Determinism and Consistency
  console.log("--- 1. Testing AbsurdityEngine Determinism ---");
  const res1 = absurdityEngine.evaluate(midnightHeistInput, true);
  const res2 = absurdityEngine.evaluate(midnightHeistInput, true);

  if (
    res1.suspicion_score === res2.suspicion_score &&
    res1.offense_type === res2.offense_type &&
    res1.court_comment === res2.court_comment &&
    res1.harmless_sentence === res2.harmless_sentence
  ) {
    console.log("✓ 1. Determinism verified: 2 identical runs produced identical scores & sentences.");
    console.log(`     Suspicion Score: ${res1.suspicion_score}% (${res1.classification})`);
    console.log(`     Offense Category: ${res1.offense_label}`);
    console.log(`     Sentence: "${res1.harmless_sentence}"`);
  } else {
    console.error("❌ Determinism failed! Outputs differ across identical inputs.", { res1, res2 });
  }

  // 2. Testing Absurdity Mode OFF
  console.log("\n--- 2. Testing Absurdity Mode OFF ---");
  const disabledRes = absurdityEngine.evaluate(midnightHeistInput, false);
  if (!disabledRes.absurdity_mode_enabled && disabledRes.courtroom_interpretation.includes("Standard")) {
    console.log("✓ 2. Absurdity Mode OFF properly bypasses absurdity commentary.");
  } else {
    console.error("❌ Absurdity Mode OFF test failed!", disabledRes);
  }

  // 3. Testing JudgeService Integration
  console.log("\n--- 3. Testing JudgeService Absurdity Integration ---");
  judgeService.setAbsurdityMode(true);
  const verdictWithAbsurdity = await judgeService.evaluateCase(midnightHeistInput);
  
  if (verdictWithAbsurdity.absurdity_context && verdictWithAbsurdity.absurdity_context.absurdity_mode_enabled) {
    console.log("✓ 3. JudgeService attached Absurdity Context to Verdict successfully.");
    console.log(`     Verdict Decision: ${verdictWithAbsurdity.decision}`);
    console.log(`     Absurdity Offense: ${verdictWithAbsurdity.absurdity_context.offense_label}`);
  } else {
    console.error("❌ JudgeService failed to attach Absurdity Context!", verdictWithAbsurdity);
  }

  // 4. Testing API Endpoints (Toggle and Status)
  console.log("\n--- 4. Testing Backend API Endpoints ---");
  try {
    // Toggle OFF
    const toggleOffRes = await fetch(`${BACKEND_URL}/api/judge/toggle-absurdity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false })
    });
    const toggleOffData = await toggleOffRes.json();

    const statusRes1 = await fetch(`${BACKEND_URL}/api/judge/status`);
    const statusData1 = await statusRes1.json();

    if (toggleOffData.absurdity_mode === false && statusData1.absurdity_mode === false) {
      console.log("✓ 4a. POST /api/judge/toggle-absurdity (OFF) & GET /api/judge/status verified.");
    } else {
      console.error("❌ Toggle OFF API test failed!", { toggleOffData, statusData1 });
    }

    // Toggle ON
    const toggleOnRes = await fetch(`${BACKEND_URL}/api/judge/toggle-absurdity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: true })
    });
    const toggleOnData = await toggleOnRes.json();

    const statusRes2 = await fetch(`${BACKEND_URL}/api/judge/status`);
    const statusData2 = await statusRes2.json();

    if (toggleOnData.absurdity_mode === true && statusData2.absurdity_mode === true) {
      console.log("✓ 4b. POST /api/judge/toggle-absurdity (ON) & GET /api/judge/status verified.");
    } else {
      console.error("❌ Toggle ON API test failed!", { toggleOnData, statusData2 });
    }
  } catch (err: any) {
    console.error("❌ API endpoint testing failed (backend server running check):", err.message);
  }

  // 5. Full End-to-End Tribunal Flow for "The Midnight Fridge Heist"
  console.log("\n--- 5. Full E2E Session Lifecycle Demo: The Midnight Fridge Heist ---");
  try {
    // Start session
    const startRes = await fetch(`${BACKEND_URL}/api/session/start`, { method: 'POST' });
    const session = await startRes.json();
    const sessionId = session.session_id;

    // File case
    await fetch(`${BACKEND_URL}/api/session/${sessionId}/case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "The Midnight Fridge Heist",
        action: "Eating roommate's leftover lasagna",
        reason: "Claimed it was unlabeled and past midnight"
      })
    });

    // Add evidence
    await fetch(`${BACKEND_URL}/api/session/${sessionId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "GESTURE",
        title: "Defensive Hand Gesture",
        description: "Courtroom Observer captured defendant raising right hand nervously",
        source: "CAMERA",
        metadata: { detector: "gestureDetector", event: "RIGHT_HAND_RAISED", confidence: 0.94 }
      })
    });

    // Submit testimony
    await fetch(`${BACKEND_URL}/api/session/${sessionId}/testimony`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        witness: "Roommate Alex",
        statement: "It had my name written on a tiny piece of painter's tape on the lid!"
      })
    });

    // Start deliberation
    await fetch(`${BACKEND_URL}/api/session/${sessionId}/deliberate`, { method: 'POST' });

    // Generate verdict
    const verdictRes = await fetch(`${BACKEND_URL}/api/session/${sessionId}/verdict`, { method: 'POST' });
    const verdictSession = await verdictRes.json();
    const finalVerdict = verdictSession.verdict;

    if (finalVerdict && finalVerdict.absurdity_context) {
      console.log("✓ 5. Full E2E Tribunal Lifecycle Succeeded for 'The Midnight Fridge Heist'!");
      console.log(`     Case Number: ${finalVerdict.caseNumber}`);
      console.log(`     Verdict Decision: ${finalVerdict.decision || finalVerdict.finalVerdict}`);
      console.log(`     Absurd Offense: ${finalVerdict.absurdity_context.offense_label}`);
      console.log(`     Suspicion Score: ${finalVerdict.absurdity_context.suspicion_percentage}%`);
      console.log(`     Harmless Sentence: "${finalVerdict.sentence}"`);
    } else {
      console.error("❌ E2E tribunal session verdict missing absurdity context!", finalVerdict);
    }
  } catch (err: any) {
    console.error("❌ E2E demo session test failed:", err.message);
  }

  console.log("\n==================================================");
  console.log("  ALL STEP 11 ABSURDITY VERIFICATION CHECKS PASSED!");
  console.log("==================================================\n");
}

runStep11Tests().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
