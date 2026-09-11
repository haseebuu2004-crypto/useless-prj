export type AbsurdOffenseType =
  | "UNAUTHORIZED_HAND_ELEVATION"
  | "SUSPICIOUS_FRIDGE_RAID"
  | "EXCESSIVE_SNACK_CONSUMPTION"
  | "UNEXPLAINED_MIDNIGHT_ACTIVITY"
  | "SUSPICIOUS_CAT_ACTIVITY"
  | "UNAUTHORIZED_SIDE_EYE"
  | "QUESTIONABLE_POSTURE"
  | "EXCESSIVE_AWKWARD_SILENCE";

export type SuspicionClassification =
  | "TOTALLY_INNOCENT"
  | "MILDLY_SUSPICIOUS"
  | "DEEPLY_CONCERNING"
  | "EXTREMELY_SUSPICIOUS"
  | "ABSURDLY_GUILTY";

export interface AbsurdityContext {
  offense_type: AbsurdOffenseType;
  offense_label: string;
  suspicion_score: number;       // 0.00 to 1.00
  suspicion_percentage: number;  // 0 to 100
  classification: SuspicionClassification;
  courtroom_interpretation: string;
  court_comment: string;
  harmless_sentence: string;
  absurdity_mode_enabled: boolean;
}
