import "dotenv/config";
import { geminiNarrator } from "../services/narrative/geminiNarrator.js";
import { geminiJudgeProvider } from "../services/judge/geminiJudgeProvider.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runProofTest() {
  console.log("==================================================");
  console.log(" REAL GEMINI CASE NARRATOR & JUDGE PROOF SUITE    ");
  console.log("==================================================");

  const health = await geminiNarrator.checkHealth();
  assert(health, "GEMINI_API_KEY is missing or invalid in environment.");
  console.log("✓ Gemini API Key configured and healthy.");

  const delay = () => new Promise(r => setTimeout(r, 5000));

  // SCENARIO 1: PERSON_PRESENT
  console.log("\n--- SCENARIO 1: PERSON_PRESENT ---");
  const nar1 = await geminiNarrator.generateNarrative({
    observation_duration_seconds: 6,
    observations: [{ event: "PERSON_PRESENT", confidence: 0.95 }]
  });
  console.log(`Title: ${nar1.title}`);
  console.log(`Action: "${nar1.action}"`);
  console.log(`Reason: "${nar1.reason}"`);
  console.log(`Defense Prompt: "${nar1.defense_prompt}"`);
  assert(nar1.title.length > 0 && nar1.action.length > 0, "Scenario 1 narrative missing content");

  await delay();

  // SCENARIO 2: RIGHT_HAND_RAISED
  console.log("\n--- SCENARIO 2: RIGHT_HAND_RAISED ---");
  const nar2 = await geminiNarrator.generateNarrative({
    observation_duration_seconds: 7,
    observations: [{ event: "RIGHT_HAND_RAISED", confidence: 0.92, relative_time_seconds: 2.1 }]
  });
  console.log(`Title: ${nar2.title}`);
  console.log(`Action: "${nar2.action}"`);
  console.log(`Reason: "${nar2.reason}"`);
  console.log(`Defense Prompt: "${nar2.defense_prompt}"`);
  assert(nar2.action.toLowerCase().includes("hand") || nar2.title.toLowerCase().includes("hand") || nar2.action.toLowerCase().includes("right"), "Scenario 2 narrative did not mention hand observation");

  await delay();

  // SCENARIO 3: LOOKING_AWAY
  console.log("\n--- SCENARIO 3: LOOKING_AWAY ---");
  const nar3 = await geminiNarrator.generateNarrative({
    observation_duration_seconds: 5,
    observations: [{ event: "LOOKING_AWAY", confidence: 0.88, relative_time_seconds: 1.8 }]
  });
  console.log(`Title: ${nar3.title}`);
  console.log(`Action: "${nar3.action}"`);
  console.log(`Reason: "${nar3.reason}"`);
  console.log(`Defense Prompt: "${nar3.defense_prompt}"`);

  await delay();

  // SCENARIO 4: APPROACHING_CAMERA
  console.log("\n--- SCENARIO 4: APPROACHING_CAMERA ---");
  const nar4 = await geminiNarrator.generateNarrative({
    observation_duration_seconds: 8,
    observations: [{ event: "APPROACHING_CAMERA", confidence: 0.91, relative_time_seconds: 3.0 }]
  });
  console.log(`Title: ${nar4.title}`);
  console.log(`Action: "${nar4.action}"`);
  console.log(`Reason: "${nar4.reason}"`);
  console.log(`Defense Prompt: "${nar4.defense_prompt}"`);

  await delay();

  // SCENARIO 5: RIGHT_HAND_RAISED + LOOKING_AWAY
  console.log("\n--- SCENARIO 5: RIGHT_HAND_RAISED + LOOKING_AWAY ---");
  const nar5 = await geminiNarrator.generateNarrative({
    observation_duration_seconds: 8,
    observations: [
      { event: "RIGHT_HAND_RAISED", confidence: 0.93, relative_time_seconds: 1.5 },
      { event: "LOOKING_AWAY", confidence: 0.85, relative_time_seconds: 4.2 }
    ]
  });
  console.log(`Title: ${nar5.title}`);
  console.log(`Action: "${nar5.action}"`);
  console.log(`Reason: "${nar5.reason}"`);
  console.log(`Defense Prompt: "${nar5.defense_prompt}"`);

  await delay();

  // SCENARIO 6: RIGHT_HAND_RAISED + APPROACHING_CAMERA + SITTING_DOWN
  console.log("\n--- SCENARIO 6: RIGHT_HAND_RAISED + APPROACHING_CAMERA + SITTING_DOWN ---");
  const nar6 = await geminiNarrator.generateNarrative({
    observation_duration_seconds: 10,
    observations: [
      { event: "RIGHT_HAND_RAISED", confidence: 0.94, relative_time_seconds: 1.2 },
      { event: "APPROACHING_CAMERA", confidence: 0.89, relative_time_seconds: 4.5 },
      { event: "SITTING_DOWN", confidence: 0.87, relative_time_seconds: 7.8 }
    ]
  });
  console.log(`Title: ${nar6.title}`);
  console.log(`Action: "${nar6.action}"`);
  console.log(`Reason: "${nar6.reason}"`);
  console.log(`Defense Prompt: "${nar6.defense_prompt}"`);

  // VERIFY NARRATIVE VARIATION ACROSS SCENARIOS
  assert(nar2.action !== nar3.action, "Scenarios 2 & 3 produced identical text (not dynamic!)");
  assert(nar2.title !== nar4.title, "Scenarios 2 & 4 produced identical titles");
  assert(nar5.action !== nar6.action, "Scenarios 5 & 6 produced identical multi-observation narratives");
  console.log("\n✓ PROOF: Different observation sets produce completely distinct AI narratives.");

  // TEST REAL GEMINI AI JUDGE RESPONSE TO REAL USER DEFENSE
  console.log("\n--- REAL GEMINI AI JUDGE CASE EVALUATION ---");
  const verdict = await geminiJudgeProvider.evaluateCase({
    case_data: {
      title: nar5.title,
      action: nar5.action,
      reason: nar5.reason
    },
    evidence: [
      {
        id: "ev_1",
        exhibit_number: "EXHIBIT A",
        type: "OBSERVATION",
        title: "Initial Camera Sweep",
        description: "Right hand raised at 1.5s followed by looking away at 4.2s.",
        source: "CAMERA",
        relevance: 0.9,
        credibility: 0.9,
        created_at: new Date().toISOString()
      }
    ],
    testimony: [
      {
        id: "t_1",
        witness: "Defendant",
        statement: "Bro, I was just waving at a friend and checking if my coffee was ready!"
      }
    ]
  });

  console.log(`Verdict Decision: ${verdict.decision}`);
  console.log(`AI Reasoning: ${JSON.stringify(verdict.reasoning)}`);
  console.log(`Absurd Sentence: "${verdict.sentence}"`);

  assert(Boolean(verdict.decision && verdict.reasoning && verdict.sentence), "Gemini verdict evaluation returned incomplete payload");
  console.log("\n==================================================");
  console.log("  REAL GEMINI NARRATOR & JUDGE PROOF: ALL PASSED ");
  console.log("==================================================");
}

runProofTest().catch(err => {
  console.error("Proof test failed:", err);
  process.exit(1);
});
