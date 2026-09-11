import { JudgeInput } from "../judge/judgeTypes.js";
import { 
  AbsurdityContext, 
  AbsurdOffenseType, 
  SuspicionClassification 
} from "./absurdityTypes.js";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const HARMLESS_SENTENCES = [
  "Three hours of community service consisting entirely of apologizing to the refrigerator.",
  "Defendant is sentenced to one ceremonial bonk from the Court's gavel.",
  "Defendant must explain their actions to the nearest available houseplant.",
  "Sentenced to fold fitted sheets for eternity.",
  "Must write a formal 500-word apology to the office microwave.",
  "Condemned to use 1-ply toilet paper for 14 business days.",
  "Ordered to explain cryptocurrency to a golden retriever for 2 consecutive hours."
];

const OFFENSE_INTERPRETATIONS: Record<AbsurdOffenseType, { label: string; interpretation: string; comment: string }> = {
  UNAUTHORIZED_HAND_ELEVATION: {
    label: "Unauthorized Hand Elevation",
    interpretation: "The defendant appeared to influence the proceedings through unauthorized vertical limb deployment.",
    comment: "The tribunal finds the defendant's commitment to raising their hand without prior authorization deeply unnecessary."
  },
  SUSPICIOUS_FRIDGE_RAID: {
    label: "Suspicious Fridge Raid",
    interpretation: "Unsanctioned extraction of reserved kitchen supplies during non-jurisdictional hours.",
    comment: "The tribunal finds cold leftover raiding a direct violation of household decorum."
  },
  EXCESSIVE_SNACK_CONSUMPTION: {
    label: "Excessive Snack Consumption",
    interpretation: "Unlawful rapid depletion of communal provisions without fair distribution.",
    comment: "Consuming reserved snacks at speed violates the fundamental tenets of civilized cohabitation."
  },
  UNEXPLAINED_MIDNIGHT_ACTIVITY: {
    label: "Unexplained Midnight Activity",
    interpretation: "Stealth movement detected between 02:00 and 04:00 AM without valid bureaucratic justification.",
    comment: "The court notes that nothing good has ever occurred in a kitchen at 3:00 AM."
  },
  SUSPICIOUS_CAT_ACTIVITY: {
    label: "Feline Accomplice Involvement",
    interpretation: "Strategic alignment with a household feline to divert suspicion.",
    comment: "Blaming the cat remains an unpersuasive defense before this tribunal."
  },
  UNAUTHORIZED_SIDE_EYE: {
    label: "Unauthorized Side-Eye",
    interpretation: "Overt lateral ocular gesture exhibiting non-verbal contempt of court.",
    comment: "The tribunal considers suspicious peripheral glances a threat to court decorum."
  },
  QUESTIONABLE_POSTURE: {
    label: "Questionable Distress Posture",
    interpretation: "Defendant exhibited postural distress, indicating impending confession.",
    comment: "Placing one's hand upon one's head in courtroom distress is strongly correlated with guilt."
  },
  EXCESSIVE_AWKWARD_SILENCE: {
    label: "Excessive Awkward Silence",
    interpretation: "Failure to provide timely justification within the expected conversational window.",
    comment: "The court interprets prolonged hesitation as tactical stalling."
  }
};

export class AbsurdityEngine {
  private modeEnabled = true;

  setAbsurdityMode(enabled: boolean) {
    this.modeEnabled = enabled;
  }

  isAbsurdityModeEnabled(): boolean {
    return this.modeEnabled;
  }

  evaluate(input: JudgeInput, enabledOverride?: boolean): AbsurdityContext {
    const active = enabledOverride !== undefined ? enabledOverride : this.modeEnabled;
    const combinedText = `${input.case_data?.title || ""} ${input.case_data?.action || ""} ${input.case_data?.reason || ""}`.toLowerCase();

    // Check camera gesture evidence first
    const cameraEvents = input.evidence
      .filter(e => e.source === "CAMERA" || e.metadata?.source === "CAMERA")
      .map(e => e.metadata?.event || "");

    let offense: AbsurdOffenseType = "EXCESSIVE_AWKWARD_SILENCE";

    if (cameraEvents.some(e => e.includes("HAND_RAISED"))) {
      offense = "UNAUTHORIZED_HAND_ELEVATION";
    } else if (cameraEvents.some(e => e.includes("HAND_ON_HEAD"))) {
      offense = "QUESTIONABLE_POSTURE";
    } else if (combinedText.includes("cat") || combinedText.includes("pet") || combinedText.includes("feline")) {
      offense = "SUSPICIOUS_CAT_ACTIVITY";
    } else if (combinedText.includes("fridge") || combinedText.includes("refrigerator") || combinedText.includes("kitchen")) {
      offense = "SUSPICIOUS_FRIDGE_RAID";
    } else if (combinedText.includes("snack") || combinedText.includes("pizza") || combinedText.includes("cereal") || combinedText.includes("cake") || combinedText.includes("salmon") || combinedText.includes("cheese")) {
      offense = "EXCESSIVE_SNACK_CONSUMPTION";
    } else if (combinedText.includes("midnight") || combinedText.includes("3am") || combinedText.includes("night") || combinedText.includes("late")) {
      offense = "UNEXPLAINED_MIDNIGHT_ACTIVITY";
    } else {
      const textHash = hashString(combinedText || "default");
      const offenses: AbsurdOffenseType[] = [
        "UNAUTHORIZED_SIDE_EYE", 
        "QUESTIONABLE_POSTURE", 
        "EXCESSIVE_AWKWARD_SILENCE",
        "EXCESSIVE_SNACK_CONSUMPTION"
      ];
      offense = offenses[textHash % offenses.length];
    }

    // Deterministic Suspicion Scoring
    let rawScore = 0.25;
    rawScore += Math.min(input.evidence.length * 0.15, 0.40);
    rawScore += Math.min(input.testimony.length * 0.10, 0.20);
    
    if (cameraEvents.length > 0) {
      rawScore += 0.15;
    }

    const hashMod = (hashString(combinedText + input.evidence.length) % 15) / 100;
    rawScore += hashMod;

    if (rawScore > 0.99) rawScore = 0.99;
    if (rawScore < 0.05) rawScore = 0.05;

    const suspicion_score = Number(rawScore.toFixed(2));
    const suspicion_percentage = Math.round(suspicion_score * 100);

    let classification: SuspicionClassification = "MILDLY_SUSPICIOUS";
    if (suspicion_score < 0.25) classification = "TOTALLY_INNOCENT";
    else if (suspicion_score < 0.45) classification = "MILDLY_SUSPICIOUS";
    else if (suspicion_score < 0.70) classification = "DEEPLY_CONCERNING";
    else if (suspicion_score < 0.88) classification = "EXTREMELY_SUSPICIOUS";
    else classification = "ABSURDLY_GUILTY";

    const textHash = hashString(combinedText || "sentence");
    const harmless_sentence = HARMLESS_SENTENCES[textHash % HARMLESS_SENTENCES.length];
    const details = OFFENSE_INTERPRETATIONS[offense];

    if (!active) {
      return {
        offense_type: offense,
        offense_label: "Standard Offense Evaluation",
        suspicion_score,
        suspicion_percentage,
        classification,
        courtroom_interpretation: "Standard evidence evaluation without absurd commentary.",
        court_comment: "The tribunal evaluated the case under standard factual protocol.",
        harmless_sentence: "Standard warning issued to the defendant.",
        absurdity_mode_enabled: false
      };
    }

    return {
      offense_type: offense,
      offense_label: details.label,
      suspicion_score,
      suspicion_percentage,
      classification,
      courtroom_interpretation: details.interpretation,
      court_comment: details.comment,
      harmless_sentence,
      absurdity_mode_enabled: true
    };
  }
}

export const absurdityEngine = new AbsurdityEngine();
