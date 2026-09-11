/**
 * Tribunal Content Engine — Backend Module
 * 
 * Synchronized with frontend content engine for natural Kerala Manglish dialogue,
 * voice patterns, sequence combinations, and factual integrity.
 */

export type CVEventName = 
  | "PERSON_PRESENT"
  | "RIGHT_HAND_RAISED"
  | "LEFT_HAND_RAISED"
  | "BOTH_HANDS_RAISED"
  | "HAND_ON_HEAD"
  | "LOOKING_AWAY"
  | "STANDING_UP"
  | "SITTING_DOWN"
  | "APPROACHING_CAMERA"
  | "HANDS_CROSSED";

export interface AccusationOutput {
  title: string;
  action: string;
  reason: string;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickDeterministic<T>(arr: T[], seed: string): T {
  if (!arr || arr.length === 0) throw new Error("Empty array passed to pickDeterministic");
  const idx = hashString(seed) % arr.length;
  return arr[idx];
}

export const ABSURD_SENTENCES = [
  "Mandatory apology to the nearest ceiling fan.",
  "14 business days of 1-ply toilet paper.",
  "Three days without putting your phone on charge before sleeping.",
  "You are hereby sentenced to explaining yourself to your mother.",
  "Seven consecutive mornings of stepping on a wet bathroom floor.",
  "One week of watching ads before every YouTube video.",
  "Three days of tea without enough sugar.",
  "Two days of opening the fridge and finding absolutely nothing useful.",
  "Five minutes of standing in front of the mirror questioning your life choices.",
  "One hour of trying to un-stick tape that is stuck to itself.",
  "Four days of wearing socks that slide down inside your shoes."
];

const SINGLE_OBSERVATION_ACCUSATIONS: Record<string, Array<{ title: string; action: string; reason: string }>> = {
  RIGHT_HAND_RAISED: [
    {
      title: "UNAUTHORIZED HAND ELEVATION",
      action: "Bro, enthina hand raise cheythath? Permission eduthittundo?",
      reason: "Unauthorized hand raising in courtroom zone constitutes overt breach of decorum."
    },
    {
      title: "SUSPICIOUS HAND RAISING",
      action: "Okay, right hand court note cheythu. Hand elevation-u entha justification?",
      reason: "Unprompted arm gestures correlate strongly with tactical distraction."
    },
    {
      title: "PREMEDITATED HAND ELEVATION",
      action: "Bro, court noticed you raising your right hand without permission.",
      reason: "Elevating hands prior to formal court authorization breaches observation decorum."
    }
  ],
  LEFT_HAND_RAISED: [
    {
      title: "LEFT-SIDED COURTROOM MISCONDUCT",
      action: "Left side ilum activity undallo. Ee handum suspicious aanu.",
      reason: "Sinister left-side limb elevation requires immediate review."
    },
    {
      title: "UNAUTHORIZED LEFT HAND ELEVATION",
      action: "Bro, left hand raise cheythitt entha purpose? Court is watching.",
      reason: "Asymmetric limb posture during monitoring indicates non-standard compliance."
    }
  ],
  BOTH_HANDS_RAISED: [
    {
      title: "FULL-SCALE HAND DEPLOYMENT",
      action: "Randum handsum? Enthaanu ee confidence? Full hand deployment aanallo.",
      reason: "Dual hand elevation creates severe visual clutter in observation sweep."
    },
    {
      title: "DUAL HAND COURTROOM DISTURBANCE",
      action: "Both hands raised position-il standing... court permission tharnnilla.",
      reason: "Simultaneous bilateral arm movement simulates dramatic surrender."
    }
  ],
  HAND_ON_HEAD: [
    {
      title: "EXCESSIVE COURTROOM CONFUSION",
      action: "Everything okay bro? Head-il hand vechittundu. Court concerned aanu.",
      reason: "Head-touching stress postures correlate strongly with unspoken guilt."
    },
    {
      title: "UNAUTHORIZED HEAD CONTACT",
      action: "Bro, head-il hand vech panic mode-il sit cheyyunnath suspicious aanu.",
      reason: "Public display of existential distress breaches observation zone decorum."
    }
  ],
  LOOKING_AWAY: [
    {
      title: "ATTEMPTED COURTROOM AVOIDANCE",
      action: "Bro, court ivide aanu. Avide entha ithra interesting?",
      reason: "Evasive eye movement away from observer demonstrates clear court avoidance."
    },
    {
      title: "SUSPICIOUS EYE DIVERSION",
      action: "Eye contact kurach weak aanu. Courtinte side nokkathe entha thirayunnath?",
      reason: "Aversion of ocular gaze indicates tactical unwillingness to face the bench."
    }
  ],
  STANDING_UP: [
    {
      title: "UNAUTHORIZED STANDING",
      action: "Aaranu ezhunelkaan permission thannath? Standing up under suspicious conditions.",
      reason: "Unprompted vertical body displacement disrupts preliminary observation."
    },
    {
      title: "PREMATURE VERTICAL ACTIVITY",
      action: "Bro, ezhunett ninnitt entha purpose? Court permission tharathilla.",
      reason: "Abrupt posture changes during surveillance indicate flight risk posture."
    }
  ],
  SITTING_DOWN: [
    {
      title: "UNAUTHORIZED SEATING",
      action: "Already comfortable aayo? Bro, court session kazhinjittilla.",
      reason: "Premature sitting down before formal court invitation exhibits over-confidence."
    },
    {
      title: "PREMATURE COURTROOM COMFORT",
      action: "Bro, casual aayi sit cheyan samayam aayilla. Session active aanu.",
      reason: "Excessive comfort during observation correlates with nonchalant guilt."
    }
  ],
  APPROACHING_CAMERA: [
    {
      title: "INTIMIDATION OF COURT OFFICIAL",
      action: "Bro, camera-yude aduthu enthina varunne? Distance maintain cheyyane.",
      reason: "Advancing toward the camera boundary constitutes physical pressure on the bench."
    },
    {
      title: "UNAUTHORIZED APPROACH TOWARD THE BENCH",
      action: "Defendant courtine approach cheyyunnu. Close-up-il vannitt intimidation patilla.",
      reason: "Encroaching upon observer lens zone violates safety buffer guidelines."
    }
  ],
  HANDS_CROSSED: [
    {
      title: "DEFENSIVE BODY LANGUAGE",
      action: "Defensive mode aanalle? Okay... arms crossed. Court note cheythu.",
      reason: "Crossed arms present an uncooperative posture to courtroom observers."
    },
    {
      title: "ARMS CROSSED UNDER SUSPICIOUS CIRCUMSTANCES",
      action: "Bro, arms fold cheythitt court-ine defiance cheyyano?",
      reason: "Defensive body fortification indicates emotional resistance to trial."
    }
  ],
  PERSON_PRESENT: [
    {
      title: "SUSPICIOUSLY EXISTING WITHOUT APPARENT PURPOSE",
      action: "Bro, court noticed you standing in the observation zone for no acceptable reason.",
      reason: "Prolonged stillness before tribunal observer correlates strongly with tactical stalling."
    },
    {
      title: "UNEXPLAINED PRESENCE",
      action: "Court ningale kandondirikkunnund. Unexplained existence in observation grid.",
      reason: "Latching onto observer feed without declared purpose requires formal explanation."
    }
  ]
};

export class TribunalContentEngine {
  generateAccusation(events: string[], seed: string = "accusation"): AccusationOutput {
    const cleanEvents = (events || []).map(e => e.toUpperCase());

    const uniqueEvents = Array.from(new Set(cleanEvents.map(e => {
      if (e.includes("HAND_RAISED")) return "HAND_RAISED";
      if (e.includes("HAND_ON_HEAD")) return "HAND_ON_HEAD";
      if (e.includes("LOOKING_AWAY")) return "LOOKING_AWAY";
      if (e.includes("APPROACHING") || e.includes("CAMERA")) return "APPROACHING";
      if (e.includes("SITTING")) return "SITTING";
      if (e.includes("STANDING")) return "STANDING";
      if (e.includes("HANDS_CROSSED")) return "HANDS_CROSSED";
      return e;
    }))).filter(e => e !== "PERSON_PRESENT");

    if (uniqueEvents.length >= 2) {
      if (cleanEvents.some(e => e.includes("HAND_RAISED")) && cleanEvents.some(e => e.includes("LOOKING_AWAY")) && cleanEvents.some(e => e.includes("SITTING"))) {
        return {
          title: "PATTERN OF HIGHLY QUESTIONABLE BEHAVIOUR",
          action: "First hand raise cheythu, pinne courtine nokkilla, ippo comfortable aayi irikkunnu. Bro... ee case simple alla.",
          reason: "Multi-event sequence demonstrates coordinated courtroom misconduct."
        };
      }

      if (cleanEvents.some(e => e.includes("APPROACHING")) && cleanEvents.some(e => e.includes("HANDS_CROSSED"))) {
        return {
          title: "DEFENSIVE COURTROOM APPROACH",
          action: "Camera-yude aduthu vannu, pinne arms cross cheythu. Defendant full defensive mode aanu.",
          reason: "Encroaching on lens while holding defensive posture violates observation protocol."
        };
      }

      const descriptions: string[] = [];
      if (cleanEvents.some(e => e.includes("HAND_RAISED"))) descriptions.push("hand raise cheythu");
      if (cleanEvents.some(e => e.includes("LOOKING_AWAY"))) descriptions.push("eye contact cut cheythu");
      if (cleanEvents.some(e => e.includes("APPROACHING"))) descriptions.push("camera-yude aduthu vannu");
      if (cleanEvents.some(e => e.includes("SITTING"))) descriptions.push("casual aayi sit cheythu");
      if (cleanEvents.some(e => e.includes("HAND_ON_HEAD"))) descriptions.push("head-il hand vech panic cheythu");

      return {
        title: "PATTERN OF HIGHLY QUESTIONABLE BEHAVIOUR",
        action: `First ${descriptions.join(", pinne ") || "actions observed"}. Bro... ee sequence court note cheythu.`,
        reason: `Combined multi-event sequence (${uniqueEvents.join(", ")}) demonstrates suspicious behavior.`
      };
    }

    let primaryKey = "PERSON_PRESENT";
    if (cleanEvents.some(e => e.includes("BOTH_HANDS_RAISED"))) primaryKey = "BOTH_HANDS_RAISED";
    else if (cleanEvents.some(e => e.includes("LEFT_HAND_RAISED"))) primaryKey = "LEFT_HAND_RAISED";
    else if (cleanEvents.some(e => e.includes("RIGHT_HAND_RAISED") || e === "HAND_RAISED")) primaryKey = "RIGHT_HAND_RAISED";
    else if (cleanEvents.some(e => e.includes("HAND_ON_HEAD"))) primaryKey = "HAND_ON_HEAD";
    else if (cleanEvents.some(e => e.includes("LOOKING_AWAY"))) primaryKey = "LOOKING_AWAY";
    else if (cleanEvents.some(e => e.includes("APPROACHING"))) primaryKey = "APPROACHING_CAMERA";
    else if (cleanEvents.some(e => e.includes("STANDING"))) primaryKey = "STANDING_UP";
    else if (cleanEvents.some(e => e.includes("SITTING"))) primaryKey = "SITTING_DOWN";
    else if (cleanEvents.some(e => e.includes("HANDS_CROSSED"))) primaryKey = "HANDS_CROSSED";
    else if (cleanEvents.some(e => e.includes("HAND_RAISED"))) primaryKey = "RIGHT_HAND_RAISED";

    const options = SINGLE_OBSERVATION_ACCUSATIONS[primaryKey] || SINGLE_OBSERVATION_ACCUSATIONS["PERSON_PRESENT"];
    return pickDeterministic(options, seed + primaryKey);
  }

  getObservationDialogue(eventStr: string, seed: string = "dialogue"): string {
    const s = (eventStr || "").toUpperCase();

    if (s.includes("RIGHT_HAND_RAISED") || s === "HAND_RAISED") {
      return pickDeterministic([
        "Bro, enthina hand raise cheythath?",
        "Permission eduthittundo?",
        "Okay, right hand court note cheythu."
      ], seed);
    }
    if (s.includes("LEFT_HAND_RAISED")) {
      return pickDeterministic([
        "Left side ilum activity undallo.",
        "Ee handum suspicious aanu."
      ], seed);
    }
    if (s.includes("BOTH_HANDS_RAISED")) {
      return pickDeterministic([
        "Randum handsum? Enthaanu ee confidence?",
        "Bro, full hand deployment aanallo."
      ], seed);
    }
    if (s.includes("HAND_ON_HEAD")) {
      return pickDeterministic([
        "Everything okay bro?",
        "Head-il hand vechittundu. Court concerned aanu."
      ], seed);
    }
    if (s.includes("LOOKING_AWAY")) {
      return pickDeterministic([
        "Bro, court ivide aanu.",
        "Avide entha ithra interesting?",
        "Eye contact kurach weak aanu."
      ], seed);
    }
    if (s.includes("STANDING")) {
      return pickDeterministic([
        "Aaranu ezhunelkaan permission thannath?",
        "Unauthorized standing detected."
      ], seed);
    }
    if (s.includes("SITTING")) {
      return pickDeterministic([
        "Already comfortable aayo?",
        "Bro, court session kazhinjittilla."
      ], seed);
    }
    if (s.includes("APPROACHING")) {
      return pickDeterministic([
        "Bro, camera-yude aduthu enthina varunne?",
        "Defendant courtine approach cheyyunnu.",
        "Distance maintain cheyyane."
      ], seed);
    }
    if (s.includes("HANDS_CROSSED")) {
      return pickDeterministic([
        "Defensive mode aanalle?",
        "Okay... arms crossed. Court note cheythu."
      ], seed);
    }

    return pickDeterministic([
      "Court ningale kandondirikkunnund.",
      "Court ippo observe cheyyum.",
      "Relax cheytho... court watch cheyyunnund.",
      "Kurach neram ningale observe cheyyatte."
    ], seed);
  }

  getCameraStartText(seed: string = "camstart"): string {
    return pickDeterministic([
      "Okay... camera on aayi.",
      "Courtroom ready aanu.",
      "Camera ready. Defendant evide?"
    ], seed);
  }

  getPersonDetectedText(seed: string = "person"): string {
    return pickDeterministic([
      "Aha. Defendant vannu.",
      "Okay, ningale kandupidichu.",
      "Finally... defendant appeared."
    ], seed);
  }

  getCaseFiledText(seed: string = "casefiled"): string {
    return pickDeterministic([
      "Okay. Scene serious aanu.",
      "Case file cheythu.",
      "Unfortunately... ningal ippo officially accused aanu."
    ], seed);
  }

  getDefensePrompt(events: string[], seed: string = "defense"): string {
    const clean = (events || []).map(e => e.toUpperCase());
    if (clean.some(e => e.includes("HAND_RAISED") || e.includes("HAND_ON_HEAD"))) {
      return pickDeterministic([
        "Okay bro, explain cheyyu. Ee hand situation entha?",
        "Hand elevation-u entha valid justification? Parayu.",
        "Court kelkkaan ready aanu. Ningalude side parayu."
      ], seed);
    }
    if (clean.some(e => e.includes("LOOKING_AWAY"))) {
      return pickDeterministic([
        "Entha courtine nokkathe irunnath? Explain cheyyu.",
        "Eye contact weak aanu. Ningalude side parayu."
      ], seed);
    }
    if (clean.some(e => e.includes("APPROACHING"))) {
      return pickDeterministic([
        "Camera-yude aduthu vannath enthina? Court wants answers.",
        "Okay bro, explain cheyyu."
      ], seed);
    }

    return pickDeterministic([
      "Ippo ningalude chance.",
      "Ningalude side parayu.",
      "Okay bro, explain cheyyu.",
      "Court kelkkaan ready aanu."
    ], seed);
  }

  getDeliberationMessage(evidenceCount: number, hasTestimony: boolean, seed: string = "deliberation"): string {
    if (hasTestimony && evidenceCount > 2) {
      return pickDeterministic([
        "Evidenceum defenseum compare cheyyunnund.",
        "Situation kurach complicated aanu.",
        "One minute... evidence nokkathe."
      ], seed);
    }
    return pickDeterministic([
      "One minute... evidence nokkathe.",
      "Judge ippo serious aayi think cheyyunnund.",
      "Situation kurach serious aanu."
    ], seed);
  }

  getVerdictIntroduction(decision: string, seed: string = "verdict"): string {
    const d = (decision || "GUILTY").toUpperCase();
    if (d === "GUILTY") {
      return pickDeterministic([
        "Bro... courtinu vere vazhi kandupidikkan pattiyilla.",
        "Bro... courtinu ith accept cheyyan pattilla.",
        "Bro... court kandathokke vech nokkiyal ningal innocent aanennu parayan kurach difficult aanu."
      ], seed);
    }
    if (d === "NOT_GUILTY" || d === "INNOCENT") {
      return pickDeterministic([
        "Okay okay... ee round ningal jayichu.",
        "You are acquitted. Court accepts your explanation this time."
      ], seed);
    }
    if (d === "MILDLY_SUSPICIOUS") {
      return pickDeterministic([
        "Technically innocent aanu... pakshe courtinu doubts und.",
        "Court still has questions, but case closed for now."
      ], seed);
    }
    return pickDeterministic([
      "Honestly... courtinum entha sambhavichath enn ariyilla.",
      "Ith case aayi consider cheyyan polum valare stupid aanu."
    ], seed);
  }

  getAbsurdSentence(seed: string = "sentence"): string {
    return pickDeterministic(ABSURD_SENTENCES, seed);
  }
}

export const tribunalContentEngine = new TribunalContentEngine();
