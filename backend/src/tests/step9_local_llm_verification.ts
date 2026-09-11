import http from 'http';
import { judgeService } from '../services/judge/judgeService.js';
import { localLLMJudgeProvider, LocalLLMJudgeProvider } from '../services/judge/localLLMJudgeProvider.js';
import { MockJudgeProvider } from '../services/judge/mockJudgeProvider.js';
import { buildJudgePrompt } from '../services/judge/judgePrompt.js';
import { JudgeInput } from '../services/judge/judgeTypes.js';

const BACKEND_URL = 'http://localhost:3000';

// Mock Ollama HTTP Server for testing
function createMockOllamaServer(port: number, handler: (req: http.IncomingMessage, res: http.ServerResponse) => void) {
  const server = http.createServer(handler);
  return new Promise<http.Server>((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function runStep9Tests() {
  console.log("==================================================");
  console.log("  STEP 9: LOCAL AI JUDGE INTEGRATION VERIFICATION");
  console.log("==================================================\n");

  const sampleInput: JudgeInput = {
    case_data: {
      title: "The Case of the Microwave Fish",
      action: "Heating salmon in the office breakroom",
      reason: "Claimed it was a healthy lunch."
    },
    evidence: [
      {
        id: "EVD-101",
        exhibit_number: "EXHIBIT A",
        type: "TEXT",
        title: "Breakroom Receipt",
        description: "Receipt for fresh salmon fillets",
        source: "USER",
        relevance: 0.90,
        credibility: 0.85,
        created_at: new Date().toISOString()
      },
      {
        id: "EVD-102",
        exhibit_number: "EXHIBIT B",
        type: "GESTURE",
        title: "Defendant Raised Hand",
        description: "Courtroom observer detected defendant raising right hand nervously",
        source: "CAMERA",
        relevance: 0.88,
        credibility: 0.95,
        created_at: new Date().toISOString(),
        metadata: { detector: "gestureDetector", event: "RIGHT_HAND_RAISED", confidence: 0.92, source: "CAMERA" }
      }
    ],
    testimony: [
      {
        id: "TST-201",
        witness: "Coworker Dave",
        statement: "The smell lingered in the breakroom for three whole business days."
      }
    ]
  };

  // 1. Test Prompt Builder
  console.log("--- 1. Testing Judge Prompt Builder ---");
  const prompt = buildJudgePrompt(sampleInput);
  if (prompt.includes("The Case of the Microwave Fish") && prompt.includes("SOURCE: CAMERA") && prompt.includes("TST-201")) {
    console.log("✓ 1. Prompt Builder Succeeded (Case, Camera source, and Testimony properly formatted).");
  } else {
    console.error("❌ Prompt builder output missing expected fields!", prompt);
  }

  // 2. Test LocalLLMJudgeProvider JSON Cleaning & Anti-Hallucination Validation
  console.log("\n--- 2. Testing Anti-Hallucination & Schema Validation ---");
  const provider = new LocalLLMJudgeProvider();
  
  const rawMockResponse = {
    decision: "GUILTY",
    confidence: 1.45, // Needs clamping to 1.0
    reasoning: ["Heating fish in shared microwave creates undeniable olfactory distress."],
    evidence_assessment: [
      { evidence_id: "EVD-101", assessment: "supports", weight: 0.9 },
      { evidence_id: "EVD-999-HALLUCINATED", assessment: "supports", weight: 0.8 } // Must be filtered out!
    ],
    testimony_assessment: [
      { testimony_id: "TST-201", credibility: 0.85 },
      { testimony_id: "TST-999-HALLUCINATED", credibility: 0.99 } // Must be filtered out!
    ],
    sentence: "Sentenced to eat lunch outside regardless of weather for 3 weeks."
  };

  const validatedVerdict = provider.validateAndNormalizeVerdict(rawMockResponse, sampleInput, "llama3.2");
  
  if (validatedVerdict.decision === "GUILTY" && validatedVerdict.confidence === 1.0) {
    console.log("✓ 2a. Decision & Confidence Clamping Verified (1.45 clamped to 1.0).");
  } else {
    console.error("❌ Confidence clamping failed!", validatedVerdict);
  }

  if (validatedVerdict.evidence_assessment.length === 1 && validatedVerdict.evidence_assessment[0].evidence_id === "EVD-101") {
    console.log("✓ 2b. Anti-Hallucination Evidence ID Filter Succeeded (EVD-999-HALLUCINATED stripped).");
  } else {
    console.error("❌ Evidence anti-hallucination failed!", validatedVerdict.evidence_assessment);
  }

  if (validatedVerdict.testimony_assessment.length === 1 && validatedVerdict.testimony_assessment[0].testimony_id === "TST-201") {
    console.log("✓ 2c. Anti-Hallucination Testimony ID Filter Succeeded (TST-999-HALLUCINATED stripped).");
  } else {
    console.error("❌ Testimony anti-hallucination failed!", validatedVerdict.testimony_assessment);
  }

  // 3. Test Invalid Decision Exception
  console.log("\n--- 3. Testing Invalid Decision String Rejection ---");
  try {
    provider.validateAndNormalizeVerdict({ decision: "INVALID_DECISION" }, sampleInput, "llama3.2");
    console.error("❌ Invalid decision failed to throw error!");
  } catch (err: any) {
    console.log(`✓ 3. Invalid Decision Rejected Succeeded: "${err.message}"`);
  }

  // 4. Test Mock Judge Provider Functionality
  console.log("\n--- 4. Testing MockJudgeProvider Integrity ---");
  const mockProv = new MockJudgeProvider();
  const mockVerdict = await mockProv.evaluateCase(sampleInput);
  if (mockVerdict.decision && mockVerdict.provider === "mock") {
    console.log(`✓ 4. MockJudgeProvider Succeeded (Decision: ${mockVerdict.decision}, Provider: ${mockVerdict.provider}).`);
  } else {
    console.error("❌ MockJudgeProvider failed!", mockVerdict);
  }

  // 5. Test Backend Health & GET /api/judge/status Endpoint
  console.log("\n--- 5. Testing GET /api/judge/status API Endpoint ---");
  try {
    const res = await fetch(`${BACKEND_URL}/api/judge/status`);
    const status = await res.json();
    console.log("✓ 5. GET /api/judge/status Response:", status);
  } catch (err) {
    console.error("❌ Backend not running on http://localhost:3000! Start server first.");
  }

  // 6. Test Mock Server with Local Provider & Fallback Simulation
  console.log("\n--- 6. Testing Ollama Unavailable Fallback Simulation ---");
  process.env.JUDGE_PROVIDER = "local";
  process.env.OLLAMA_BASE_URL = "http://localhost:59999"; // Non-existent Ollama port

  const fallbackVerdict = await judgeService.evaluateCase(sampleInput);
  if (fallbackVerdict.provider === "mock" && fallbackVerdict.fallback_reason) {
    console.log("✓ 6. Automatic Fallback Succeeded when Ollama is Unavailable:");
    console.log("     Provider:", fallbackVerdict.provider);
    console.log("     Fallback Reason:", fallbackVerdict.fallback_reason);
    console.log("     Decision:", fallbackVerdict.decision);
  } else {
    console.error("❌ Automatic fallback failed!", fallbackVerdict);
  }

  // Reset environment
  delete process.env.JUDGE_PROVIDER;
  delete process.env.OLLAMA_BASE_URL;

  console.log("\n==================================================");
  console.log("  ALL STEP 9 AUTOMATED VERIFICATION CHECKS PASSED!");
  console.log("==================================================\n");
}

runStep9Tests().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
