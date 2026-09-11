import { VisionEvent, VisionEventType } from "./visionTypes.js";

export type VisionEventCallback = (event: VisionEvent) => void;

interface PostureState {
  firstSeenAt: number;
  lastSeenAt: number;
  emitted: boolean;
}

class GestureDetector {
  private listeners: VisionEventCallback[] = [];
  private confidenceThreshold = 0.70;
  
  private poseStates = new Map<string, PostureState>();
  private lastEmitTime = 0;
  private readonly COOLDOWN_MS = 3000;
  
  private readonly POSE_DURATIONS: Record<string, number> = {
    STILLNESS: 4000,
    LEFT_HAND_RAISED: 800,
    RIGHT_HAND_RAISED: 800,
    BOTH_HANDS_RAISED: 800,
    HAND_ON_HEAD: 1000,
    LEANING: 2000,
    CROUCHING: 1500,
    STANDING: 2000,
    SITTING: 2000,
    MOVEMENT: 1500,
    LEFT_FRAME: 2000,
    RETURNED_TO_FRAME: 1000,
    STANDING_UP: 500,
    SITTING_DOWN: 500,
    CROUCHING_DOWN: 500,
    RISING_FROM_CROUCH: 500
  };

  private lastNosePos: {x: number, y: number} | null = null;
  private wasInFrame: boolean = false;
  private currentPosture: "STANDING" | "SITTING" | "CROUCHING" | "UNKNOWN" = "UNKNOWN";

  setConfidenceThreshold(threshold: number) {
    this.confidenceThreshold = threshold;
  }

  onEvent(callback: VisionEventCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  emit(event: VisionEvent) {
    if (event.confidence < this.confidenceThreshold) return;
    this.listeners.forEach(cb => cb(event));
    this.lastEmitTime = Date.now();
  }

  mockVisionEvent(eventType: VisionEventType, confidence = 0.91, metadata?: Record<string, any>): VisionEvent {
    const event: VisionEvent = {
      detector: "gestureDetector",
      event: eventType,
      confidence,
      timestamp: new Date().toISOString(),
      source: "CAMERA",
      metadata: {
        gesture: eventType,
        isMock: true,
        ...metadata,
      },
    };
    this.emit(event);
    return event;
  }

  private updatePoseState(poseName: string, isActive: boolean, now: number, additionalMetadata: any = {}) {
    let state = this.poseStates.get(poseName);
    
    if (isActive) {
      if (!state) {
        state = { firstSeenAt: now, lastSeenAt: now, emitted: false };
        this.poseStates.set(poseName, state);
      } else {
        state.lastSeenAt = now;
        const duration = now - state.firstSeenAt;
        const requiredDuration = this.POSE_DURATIONS[poseName] || 500;
        
        if (duration >= requiredDuration && !state.emitted) {
          // Transitions and specific fast events bypass global cooldown to capture the immediate change
          const isTransition = poseName.includes("_DOWN") || poseName.includes("_UP") || poseName.includes("RETURNED") || poseName === "LEFT_FRAME";
          
          if (now - this.lastEmitTime >= this.COOLDOWN_MS || poseName === "PERSON_PRESENT" || isTransition) {
            this.emit({
              detector: "gestureDetector",
              event: poseName as VisionEventType,
              confidence: 0.92,
              timestamp: new Date().toISOString(),
              source: "CAMERA",
              metadata: { gesture: poseName, durationMs: duration, ...additionalMetadata }
            });
            state.emitted = true;
          }
        }
      }
    } else {
      if (state) {
        if (now - state.lastSeenAt > 500) {
          this.poseStates.delete(poseName);
        }
      }
    }
  }

  analyzeLandmarks(landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }>) {
    const now = Date.now();

    if (!landmarks || landmarks.length === 0) {
      if (this.wasInFrame) {
        this.updatePoseState("LEFT_FRAME", true, now);
      }
      return;
    } else {
      if (!this.wasInFrame) {
        this.updatePoseState("RETURNED_TO_FRAME", true, now);
        this.updatePoseState("LEFT_FRAME", false, now);
        this.poseStates.delete("LEFT_FRAME");
      }
      this.wasInFrame = true;
    }

    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    if (!nose || !leftShoulder || !rightShoulder) return;

    this.updatePoseState("PERSON_PRESENT", true, now);

    // 1. Motion & Stillness Detection
    let isMoving = false;
    if (this.lastNosePos) {
      const dx = nose.x - this.lastNosePos.x;
      const dy = nose.y - this.lastNosePos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < 0.015) {
        this.updatePoseState("STILLNESS", true, now, { movementScore: dist });
        this.updatePoseState("MOVEMENT", false, now);
      } else if (dist > 0.05) {
        isMoving = true;
        this.updatePoseState("MOVEMENT", true, now, { movementScore: dist });
        this.updatePoseState("STILLNESS", false, now);
      } else {
        this.updatePoseState("STILLNESS", false, now);
        this.updatePoseState("MOVEMENT", false, now);
      }
      this.lastNosePos = {x: nose.x, y: nose.y};
    } else {
      this.lastNosePos = {x: nose.x, y: nose.y};
    }

    // 2. Hands Analysis
    const isRightRaised = rightWrist && rightWrist.y < rightShoulder.y - 0.1;
    const isLeftRaised = leftWrist && leftWrist.y < leftShoulder.y - 0.1;
    const isRightOnHead = rightWrist && Math.abs(rightWrist.x - nose.x) < 0.15 && Math.abs(rightWrist.y - nose.y) < 0.15;
    const isLeftOnHead = leftWrist && Math.abs(leftWrist.x - nose.x) < 0.15 && Math.abs(leftWrist.y - nose.y) < 0.15;

    this.updatePoseState("HAND_ON_HEAD", Boolean(isRightOnHead || isLeftOnHead), now);
    this.updatePoseState("BOTH_HANDS_RAISED", Boolean(isRightRaised && isLeftRaised), now);
    this.updatePoseState("RIGHT_HAND_RAISED", Boolean(isRightRaised && !isLeftRaised), now);
    this.updatePoseState("LEFT_HAND_RAISED", Boolean(isLeftRaised && !isRightRaised), now);

    // 3. Posture & Transitions
    const shouldersMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipsMidX = leftHip && rightHip ? (leftHip.x + rightHip.x) / 2 : null;
    const shouldersMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipsMidY = leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : null;

    if (hipsMidX !== null && hipsMidY !== null) {
      const isLeaning = Math.abs(shouldersMidX - hipsMidX) > 0.15;
      this.updatePoseState("LEANING", isLeaning, now);

      const torsoHeight = Math.abs(hipsMidY - shouldersMidY);
      
      let detectedPosture: "STANDING" | "SITTING" | "CROUCHING" | "UNKNOWN" = "UNKNOWN";
      if (torsoHeight < 0.18) {
        detectedPosture = "CROUCHING";
      } else if (hipsMidY > 0.7) { 
        // Hips are low in the frame = sitting down
        detectedPosture = "SITTING";
      } else {
        detectedPosture = "STANDING";
      }

      this.updatePoseState("CROUCHING", detectedPosture === "CROUCHING", now);
      this.updatePoseState("SITTING", detectedPosture === "SITTING", now);
      this.updatePoseState("STANDING", detectedPosture === "STANDING", now);

      // Detect Transitions
      if (this.currentPosture !== "UNKNOWN" && this.currentPosture !== detectedPosture) {
        if (this.currentPosture === "STANDING" && detectedPosture === "SITTING") {
          this.updatePoseState("SITTING_DOWN", true, now, { previousPosture: "STANDING" });
        } else if (this.currentPosture === "SITTING" && detectedPosture === "STANDING") {
          this.updatePoseState("STANDING_UP", true, now, { previousPosture: "SITTING" });
        } else if (this.currentPosture === "STANDING" && detectedPosture === "CROUCHING") {
          this.updatePoseState("CROUCHING_DOWN", true, now, { previousPosture: "STANDING" });
        } else if (this.currentPosture === "CROUCHING" && detectedPosture === "STANDING") {
          this.updatePoseState("RISING_FROM_CROUCH", true, now, { previousPosture: "CROUCHING" });
        }
        this.currentPosture = detectedPosture;
      } else if (this.currentPosture === "UNKNOWN") {
        this.currentPosture = detectedPosture;
      } else {
        this.updatePoseState("SITTING_DOWN", false, now);
        this.updatePoseState("STANDING_UP", false, now);
        this.updatePoseState("CROUCHING_DOWN", false, now);
        this.updatePoseState("RISING_FROM_CROUCH", false, now);
      }
    }
  }
}


export const gestureDetector = new GestureDetector();
