/**
 * Competition Demo Mode — Pre-configured case data.
 * The single canonical Human Tribunal demo case: "The Midnight Cake Incident".
 * All demo data is isolated here so it can be swapped without touching session logic.
 */

export const DEMO_CASE = {
  title: "THE MIDNIGHT CAKE INCIDENT",
  action: "The defendant consumed the final slice of cake at approximately 3:00 AM.",
  reason: "Hunger.",
};

export const DEMO_EXHIBIT_A = {
  type: "TEXT" as const,
  title: "Empty Cake Container",
  description:
    "A glass container found in the kitchen sink at 6:00 AM. Residual frosting present. Container was marked with initials.",
  content: "Container contents: ZERO. Missing: One (1) slice of birthday cake.",
  source: "USER" as const,
};

export const DEMO_TESTIMONY = {
  witness: "Roommate",
  statement:
    "I heard suspicious chewing at approximately 3:00 AM. There was cake involved. I am certain.",
};

export const DEMO_SCRIPT_STEPS = [
  "START DEMO — Case: The Midnight Cake Incident loads",
  "EXHIBIT A — Empty Cake Container is shown",
  "CAMERA OBSERVATION — RIGHT_HAND_RAISED is detected",
  "EXHIBIT B — Unauthorized Hand Elevation entered into evidence",
  "CALL WITNESS — Roommate sworn deposition recorded",
  "BEGIN DELIBERATION — AI Judge reviews all evidence",
  "THE TRIBUNAL HAS SPOKEN — Verdict, suspicion score & sentence",
  "RESET CASE — Fresh demo can start immediately",
] as const;
