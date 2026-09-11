import { GeminiJudgeProvider } from "../services/judge/geminiJudgeProvider.js";
import { JudgeService } from "../services/judge/judgeService.js";
import { JudgeInput } from "../services/judge/judgeTypes.js";

async function runGeminiUnitTestSuite() {
  console.log("==================================================");
  console.log("  GEMINI AI JUDGE UNIT & CONFIGURATION TEST SUITE ");
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

  const sampleInput: JudgeInput = {
    case_data: {
      title: "The Microwave Alarm Incident",
      action: "Left microwave at 0:01 without clearing timer",
      reason: "Defendant claims they were in a rush."
    },
    evidence: [
      {
        id: "EV-1",
        exhibit_number: "EXHIBIT A",
        type: "TEXT",
        title: "Microwave Display Photo",
        description: "Photo showing 0:01 remaining on digital timer.",
        source: "USER",
        relevance: 0.9,
        credibility: 0.95,
        created_at: new Date().toISOString()
      }
    ],
    testimony: [
      {
        id: "TEST-1",
        witness: "Breakroom Witness",
        statement: "I heard the high-pitched beep of uncleared microwave despair."
      }
    ]
  };

  // Save original env
  const origAiProvider = process.env.AI_PROVIDER;
  const origJudgeProvider = process.env.JUDGE_PROVIDER;
  const origApiKey = process.env.GEMINI_API_KEY;
  const origModel = process.env.GEMINI_MODEL;

  try {
    // TEST 1: Gemini provider configuration check (missing key)
    process.env.GEMINI_API_KEY = "";
    const provider = new GeminiJudgeProvider();
    const isHealthyWithoutKey = await provider.checkHealth();
    assertTest(
      "Gemini provider health check reports false when GEMINI_API_KEY is missing",
      isHealthyWithoutKey === false
    );

    // TEST 2: Missing API key throws explicit error in evaluateCase (no silent fallback)
    let threwConfigError = false;
    try {
      await provider.evaluateCase(sampleInput);
    } catch (err: any) {
      threwConfigError = err.message.includes("AI JUDGE NOT CONFIGURED");
    }
    assertTest(
      "Missing API key throws explicit configuration error (no silent fallback)",
      threwConfigError
    );

    // TEST 3: Provider selection in JudgeService
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "";
    const judgeService = new JudgeService();
    const status = await judgeService.getStatus();
    assertTest(
      "JudgeService getStatus reports provider: gemini & available: false when key is missing",
      status.provider === "gemini" && status.configuredProvider === "gemini" && status.available === false
    );

    // TEST 4: Structured output validation & normalization
    const mockRawVerdict = {
      decision: "GUILTY",
      confidence: 0.92,
      reasoning: ["Exhibit A proves 0:01 left on display."],
      evidence_assessment: [
        { evidence_id: "EV-1", assessment: "supports", weight: 0.9 }
      ],
      testimony_assessment: [
        { testimony_id: "TEST-1", credibility: 0.85 }
      ],
      sentence: "Sentenced to clear microwave timers for eternity."
    };
    const parsedVerdict = provider.validateAndNormalizeVerdict(mockRawVerdict, sampleInput, "gemini-2.5-flash");
    assertTest(
      "Structured output parsing produces valid JudgeVerdict object",
      parsedVerdict.decision === "GUILTY" &&
      parsedVerdict.confidence === 0.92 &&
      parsedVerdict.provider === "gemini" &&
      parsedVerdict.model === "gemini-2.5-flash"
    );

    // TEST 5: Invalid decision normalization (maps unrecognized decision safely)
    const invalidDecisionRaw = {
      ...mockRawVerdict,
      decision: "EXTREMELY_GUILTY_SUPREME"
    };
    const normalizedVerdict = provider.validateAndNormalizeVerdict(invalidDecisionRaw, sampleInput, "gemini-2.5-flash");
    assertTest(
      "Invalid decision string normalizes to 'SUSPICIOUS BUT INCONCLUSIVE'",
      normalizedVerdict.decision === "SUSPICIOUS BUT INCONCLUSIVE"
    );

    // TEST 6: Invalid confidence normalization (clamps < 0 or > 1)
    const outOfBoundsConfRaw = {
      ...mockRawVerdict,
      confidence: 15.5
    };
    const clampedVerdict = provider.validateAndNormalizeVerdict(outOfBoundsConfRaw, sampleInput, "gemini-2.5-flash");
    assertTest(
      "Invalid confidence > 1.0 clamps cleanly to 1.0",
      clampedVerdict.confidence === 1.0
    );

    // TEST 7: Successful response parsing with custom decisions (e.g. INNOCENT, COURTROOM CHAOS)
    const innocentRaw = {
      ...mockRawVerdict,
      decision: "COURTROOM CHAOS",
      confidence: 0.88,
      sentence: "Case dismissed due to spontaneous laughter in jury box."
    };
    const customDecisionVerdict = provider.validateAndNormalizeVerdict(innocentRaw, sampleInput, "gemini-2.5-flash");
    assertTest(
      "Custom allowed decisions (COURTROOM CHAOS) are preserved correctly",
      customDecisionVerdict.decision === "COURTROOM CHAOS" && customDecisionVerdict.sentence.includes("spontaneous laughter")
    );

  } finally {
    // Restore original env
    process.env.AI_PROVIDER = origAiProvider;
    process.env.JUDGE_PROVIDER = origJudgeProvider;
    process.env.GEMINI_API_KEY = origApiKey;
    process.env.GEMINI_MODEL = origModel;
  }

  console.log("\n==================================================");
  console.log(`  GEMINI UNIT TEST RESULTS: ${passed} / ${total} PASSED`);
  console.log("==================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runGeminiUnitTestSuite().catch(err => {
  console.error("Gemini unit test suite crashed:", err);
  process.exit(1);
});
