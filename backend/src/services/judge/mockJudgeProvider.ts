import { JudgeProvider } from "./judgeProvider.js";
import { 
  JudgeInput, 
  JudgeVerdict, 
  JudgeDecision, 
  EvidenceAssessment, 
  TestimonyAssessment 
} from "./judgeTypes.js";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const INCRIMINATING_KEYWORDS = [
  "caught", "proof", "receipt", "guilty", "confess", "stole", "ate", "empty", 
  "witness", "crime", "heist", "secret", "cheated", "sniffed", "broke", "3am", "midnight"
];

const EXONERATING_KEYWORDS = [
  "innocent", "framed", "alibi", "fake", "mistake", "denies", "accidental", 
  "never", "cat", "alien", "wrong", "borrowed", "saved", "help", "forced"
];

const SENTENCES = [
  "Must eat only the end pieces of bread for 2 weeks.",
  "Sentenced to fold fitted sheets for eternity.",
  "Ordered to write formal apology letters to all affected houseplants.",
  "Must explain crypto to a golden retriever for 3 consecutive hours.",
  "Condemned to use 1-ply toilet paper for 30 business days."
];

const CHARGES_LIST = [
  "Gross Contempt of Common Sense & Public Decorum",
  "Illicit Midnight Consumption of Reserved Supplies",
  "High Treason Against Reasonable Behavior",
  "Felonious Display of Unnecessary Absurdity",
  "Third-Degree Violation of Household Harmony"
];

export class MockJudgeProvider implements JudgeProvider {
  name = "MockJudgeProvider";

  async evaluateCase(input: JudgeInput): Promise<JudgeVerdict> {
    const caseText = `${input.case_data?.title || ""} ${input.case_data?.action || ""} ${input.case_data?.reason || ""}`.toLowerCase();
    
    let prosWeight = 0;
    let defWeight = 0;

    // Evaluate evidence using relevance, credibility, source, and text content
    const evidenceAssessment: EvidenceAssessment[] = input.evidence.map((item) => {
      const text = `${item.title} ${item.description} ${item.content || ""}`.toLowerCase();
      const incCount = INCRIMINATING_KEYWORDS.filter(k => text.includes(k)).length;
      const exCount = EXONERATING_KEYWORDS.filter(k => text.includes(k)).length;
      
      const weight = item.relevance || 0.70;
      const credMultiplier = item.credibility || 0.70;
      const effectiveWeight = Number((weight * credMultiplier).toFixed(2));

      let assessment: "supports" | "contradicts" | "irrelevant" = "irrelevant";
      
      // Source modifiers (CAMERA/SYSTEM carry high credibility)
      let sourceBonus = 1.0;
      if (item.source === "CAMERA" || item.source === "SYSTEM") sourceBonus = 1.25;

      if (incCount > exCount) {
        assessment = "supports";
        prosWeight += effectiveWeight * sourceBonus;
      } else if (exCount > incCount) {
        assessment = "contradicts";
        defWeight += effectiveWeight * sourceBonus;
      } else {
        const itemHash = hashString(item.id + text);
        if (itemHash % 2 === 0) {
          assessment = "supports";
          prosWeight += effectiveWeight * 0.5;
        } else {
          assessment = "contradicts";
          defWeight += effectiveWeight * 0.5;
        }
      }

      return {
        evidence_id: item.id,
        assessment,
        weight: effectiveWeight,
      };
    });

    // Evaluate testimony
    const testimonyAssessment: TestimonyAssessment[] = input.testimony.map((item) => {
      const text = item.statement.toLowerCase();
      const itemHash = hashString(item.id + item.witness + item.statement);
      const credibility = Number((0.35 + (itemHash % 55) / 100).toFixed(2));

      const incCount = INCRIMINATING_KEYWORDS.filter(k => text.includes(k)).length;
      const exCount = EXONERATING_KEYWORDS.filter(k => text.includes(k)).length;

      if (incCount > exCount) {
        prosWeight += credibility;
      } else if (exCount > incCount) {
        defWeight += credibility;
      } else {
        prosWeight += credibility * 0.3;
      }

      return {
        testimony_id: item.id,
        credibility,
      };
    });

    // Check case title/action keywords
    const caseInc = INCRIMINATING_KEYWORDS.filter(k => caseText.includes(k)).length;
    const caseEx = EXONERATING_KEYWORDS.filter(k => caseText.includes(k)).length;
    prosWeight += caseInc * 0.5;
    defWeight += caseEx * 0.5;

    const totalItems = input.evidence.length + input.testimony.length;
    
    let decision: JudgeDecision;
    let confidence: number;
    const reasoning: string[] = [];

    if (totalItems === 0 && !input.case_data?.action) {
      decision = "MISTRIAL";
      confidence = 0.50;
      reasoning.push("The prosecution failed to present a case, evidence, or witnesses.");
      reasoning.push("The tribunal cannot judge an empty docket.");
    } else {
      const totalScore = prosWeight + defWeight;
      const guiltRatio = totalScore > 0 ? prosWeight / totalScore : 0.5;

      if (totalItems === 0 || (guiltRatio >= 0.45 && guiltRatio <= 0.55)) {
        decision = "MISTRIAL";
        confidence = Number((0.50 + ((hashString(caseText) % 15) / 100)).toFixed(2));
        reasoning.push("The tribunal encountered an unresolvable bureaucratic tie.");
        reasoning.push("Evidence and testimony contradict each other in equal measure.");
        reasoning.push("The court orders a mistrial due to excessive ambiguity.");
      } else if (guiltRatio > 0.55) {
        decision = "GUILTY";
        confidence = Number((0.65 + (guiltRatio * 0.3)).toFixed(2));
        if (confidence > 0.99) confidence = 0.99;
        
        reasoning.push(`The prosecution provided ${input.evidence.length} exhibit(s) demonstrating suspicious intent.`);
        if (input.testimony.length > 0) {
          reasoning.push(`Witness deposition from ${input.testimony[0].witness} further damaged the defense.`);
        }
        reasoning.push("The tribunal finds the defendant guilty beyond a reasonable amount of doubt.");
      } else {
        decision = "NOT_GUILTY";
        confidence = Number((0.65 + ((1 - guiltRatio) * 0.3)).toFixed(2));
        if (confidence > 0.99) confidence = 0.99;

        reasoning.push("The defense effectively established plausible absurdity.");
        reasoning.push("The submitted exhibits failed to meet the rigorous standard of bureaucratic outrage.");
        reasoning.push("The defendant is acquitted of all charges with immediate effect.");
      }
    }

    const titleHash = hashString(caseText || "default");
    const sentence = SENTENCES[titleHash % SENTENCES.length];
    const charges = CHARGES_LIST[titleHash % CHARGES_LIST.length];

    return {
      decision,
      confidence,
      reasoning,
      evidence_assessment: evidenceAssessment,
      testimony_assessment: testimonyAssessment,
      sentence,
      charges,
      caseNumber: `CASE NO. ${(titleHash % 8999 + 1000)}-HT`,
      timestamp: new Date().toISOString(),
      provider: "mock"
    };
  }
}
