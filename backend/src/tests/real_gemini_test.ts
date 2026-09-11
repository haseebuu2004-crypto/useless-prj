import dotenv from "dotenv";
import path from "path";
import { judgeService } from "../services/judge/judgeService.js";
import { JudgeInput } from "../services/judge/judgeTypes.js";

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testRealGeminiIntegration() {
  console.log("==================================================");
  console.log("  REAL GEMINI AI JUDGE LIVE REQUEST TEST           ");
  console.log("==================================================\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey === "MY_GEMINI_API_KEY" || apiKey === "dummy_key") {
    console.log("⚠️ GEMINI_API_KEY is NOT configured in backend/.env.");
    console.log("Status: IMPLEMENTED (ready for real API key), but NOT ACTUALLY TESTED WITH A REAL GEMINI API REQUEST.");
    console.log("To run a live test, place a valid GEMINI_API_KEY in backend/.env and re-run this script.\n");
    return;
  }

  console.log("✓ GEMINI_API_KEY detected in backend/.env.");
  const status = await judgeService.getStatus();
  console.log("Status Endpoint Output:", JSON.stringify(status, null, 2));

  if (!status.available) {
    console.error("✗ Gemini provider is reporting unavailable. Check API key validity.");
    process.exit(1);
  }

  const liveTestCase: JudgeInput = {
    case_data: {
      title: "THE UNAPPROVED COFFEE POD INCIDENT",
      action: "Inserted dark roast pod into medium roast designated machine",
      reason: "Defendant claimed coffee machine lack of clear signage."
    },
    evidence: [
      {
        id: "EV-101",
        exhibit_number: "EXHIBIT A",
        type: "TEXT",
        title: "Used Pod Shell",
        description: "Found in tray marked Dark Roast #4",
        source: "USER",
        relevance: 0.95,
        credibility: 0.99,
        created_at: new Date().toISOString()
      },
      {
        id: "EV-102",
        exhibit_number: "EXHIBIT B",
        type: "GESTURE",
        title: "Raised Right Hand",
        description: "Camera observation of defendant raising right hand defensively in observation zone.",
        source: "CAMERA",
        relevance: 0.88,
        credibility: 0.94,
        created_at: new Date().toISOString(),
        metadata: { detector: "gestureDetector", event: "RIGHT_HAND_RAISED", confidence: 0.92 }
      }
    ],
    testimony: [
      {
        id: "TEST-201",
        witness: "Defendant",
        statement: "I was merely attempting to achieve 100% caffeine saturation prior to code review."
      }
    ]
  };

  console.log("\nSending live tribunal case to Google Gemini AI API...");
  const startTime = Date.now();

  try {
    const verdict = await judgeService.evaluateCase(liveTestCase);
    const elapsedMs = Date.now() - startTime;

    console.log(`\n✓ REAL GEMINI AI JUDGE RESPONSE RECEIVED IN ${elapsedMs}ms!`);
    console.log("--------------------------------------------------");
    console.log(`Decision:   ${verdict.decision}`);
    console.log(`Confidence: ${Math.round(verdict.confidence * 100)}%`);
    console.log(`Provider:   ${verdict.provider} (${verdict.model || 'gemini'})`);
    console.log(`Sentence:   "${verdict.sentence}"`);
    console.log("Reasoning:");
    verdict.reasoning.forEach((r, idx) => console.log(`  ${idx + 1}. ${r}`));
    console.log("--------------------------------------------------\n");

    console.log("==================================================");
    console.log("  VERIFICATION RESULT: ACTUALLY TESTED & PASSED!");
    console.log("==================================================\n");
  } catch (err: any) {
    console.error("\n✗ Real Gemini API request failed:", err.message);
    process.exit(1);
  }
}

testRealGeminiIntegration().catch(err => {
  console.error("Real Gemini test runner failed:", err);
  process.exit(1);
});
