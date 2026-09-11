import "dotenv/config";
import { geminiJudgeProvider } from "../services/judge/geminiJudgeProvider.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runJudgeDefenseProofTest() {
  console.log("==================================================");
  console.log(" REAL GEMINI JUDGE DEFENSE & SENTENCING PROOF     ");
  console.log("==================================================");

  const health = await geminiJudgeProvider.checkHealth();
  assert(health, "GEMINI_API_KEY is missing or invalid in environment.");
  console.log("✓ Gemini API Key configured and healthy.");

  // TEST 1: PLAUSIBLE DEFENSE (Swatting a mosquito)
  console.log("\n--- TEST 1: PLAUSIBLE DEFENSE (Swatting a mosquito) ---");
  const verdictPlausible = await geminiJudgeProvider.evaluateCase({
    case_data: {
      title: "THE UNAUTHORIZED RIGHT HAND ELEVATION",
      action: "Defendant raised right hand high in the air at 1.5 seconds.",
      reason: "Unprompted hand movement detected by camera."
    },
    evidence: [
      {
        id: "ev_1",
        exhibit_number: "EXHIBIT A",
        type: "OBSERVATION",
        title: "Camera Sweep",
        description: "Right hand raised at 1.5s mark.",
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
        statement: "Sir njan mosquito kandatha! A aggressive mosquito was buzzing near my face so I had to swat it away!"
      }
    ]
  });

  console.log(`Verdict Decision: ${verdictPlausible.decision}`);
  console.log(`AI Reasoning: ${JSON.stringify(verdictPlausible.reasoning, null, 2)}`);
  console.log(`Absurd Sentence: "${verdictPlausible.sentence}"`);

  // Verify that testimony was addressed in reasoning
  const text1 = JSON.stringify(verdictPlausible.reasoning).toLowerCase();
  assert(text1.includes("mosquito") || text1.includes("swat") || text1.includes("defense") || text1.includes("statement"), "Judge did not evaluate mosquito defense statement");

  await new Promise(r => setTimeout(r, 4000));

  // TEST 2: SILLY / GUILTY DEFENSE (Waving at a friend / checking tea)
  console.log("\n--- TEST 2: SILLY DEFENSE (Waving at friend / checking tea) ---");
  const verdictSilly = await geminiJudgeProvider.evaluateCase({
    case_data: {
      title: "THE UNLAWFUL HAND-RAISE AND LENS APPROACH",
      action: "Defendant raised right hand at 1.2s and approached the camera lens at 4.5s.",
      reason: "Subject encroached upon camera perimeter."
    },
    evidence: [
      {
        id: "ev_2",
        exhibit_number: "EXHIBIT A",
        type: "OBSERVATION",
        title: "Camera Sweep",
        description: "Right hand raised at 1.2s and approached lens at 4.5s.",
        source: "CAMERA",
        relevance: 0.9,
        credibility: 0.9,
        created_at: new Date().toISOString()
      }
    ],
    testimony: [
      {
        id: "t_2",
        witness: "Defendant",
        statement: "Bro, I was just waving at my roommate and checking if my chaya was hot!"
      }
    ]
  });

  console.log(`Verdict Decision: ${verdictSilly.decision}`);
  console.log(`AI Reasoning: ${JSON.stringify(verdictSilly.reasoning, null, 2)}`);
  console.log(`Absurd Sentence: "${verdictSilly.sentence}"`);

  // Verify that testimony was addressed in reasoning
  const text2 = JSON.stringify(verdictSilly.reasoning).toLowerCase();
  assert(text2.includes("chaya") || text2.includes("tea") || text2.includes("roommate") || text2.includes("waving") || text2.includes("coffee") || text2.includes("defense"), "Judge did not evaluate tea/roommate defense statement");

  // VERIFY DYNAMIC SENTENCING VARIATION
  assert(verdictPlausible.sentence !== verdictSilly.sentence, "Sentences were static / identical!");
  console.log("\n✓ PROOF: Gemini AI Judge generates fresh case-specific reasoning and dynamic punishments tailored to user defense.");

  console.log("\n==================================================");
  console.log("  REAL GEMINI JUDGE & SENTENCING PROOF: ALL PASSED ");
  console.log("==================================================");
}

runJudgeDefenseProofTest().catch(err => {
  console.error("Judge proof test failed:", err);
  process.exit(1);
});
