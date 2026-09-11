export type VisionEventType = 
  | "RIGHT_HAND_RAISED"
  | "LEFT_HAND_RAISED"
  | "BOTH_HANDS_RAISED"
  | "HAND_ON_HEAD"
  | "PERSON_PRESENT"
  | "STILLNESS"
  | "LEANING"
  | "CROUCHING"
  | "STANDING"
  | "SITTING"
  | "MOVEMENT"
  | "STANDING_UP"
  | "SITTING_DOWN"
  | "CROUCHING_DOWN"
  | "RISING_FROM_CROUCH"
  | "LEFT_FRAME"
  | "RETURNED_TO_FRAME";

export interface VisionEvent {
  detector: string;
  event: VisionEventType;
  confidence: number;
  timestamp: string;
  source: "CAMERA";
  metadata?: Record<string, any>;
}

export interface VisionObservationLog {
  id: string;
  event: VisionEvent;
  exhibit_number?: string;
  status: "DETECTED" | "SUBMITTED" | "THROTTLED";
}

export type VisionObserverStatus = "IDLE" | "OBSERVING" | "PAUSED" | "ERROR" | "PERMISSION_DENIED";
