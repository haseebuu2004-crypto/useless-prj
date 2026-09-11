import { VisionEvent, VisionEventType, VisionObservationLog } from "./visionTypes.js";
import { gestureDetector } from "./gestureDetector.js";
import { CreateEvidenceInput, EvidenceType } from "../../types/index.js";
import { addEvidence } from "../../api/sessionApi.js";

export type ObservationLogCallback = (log: VisionObservationLog) => void;

class VisionService {
  private activeSessionId: string | null = null;
  private isSessionClosed = false;
  private isObserving = false;
  private logs: VisionObservationLog[] = [];
  private cooldownMap: Record<string, number> = {};
  private activeStateMap: Record<string, boolean> = {};
  private logCallbacks: ObservationLogCallback[] = [];
  private unsubscribeDetector: (() => void) | null = null;

  constructor() {
    this.handleVisionEvent = this.handleVisionEvent.bind(this);
  }

  setSession(sessionId: string | null, isClosed = false) {
    this.activeSessionId = sessionId;
    this.isSessionClosed = isClosed;
    if (isClosed) {
      this.stopObservation();
    }
  }

  startObservation() {
    if (this.isSessionClosed || !this.activeSessionId) {
      console.warn("Cannot start observation without an active, open tribunal session.");
      return false;
    }
    if (this.isObserving) return true;

    this.isObserving = true;
    this.unsubscribeDetector = gestureDetector.onEvent(this.handleVisionEvent);
    return true;
  }

  stopObservation() {
    this.isObserving = false;
    if (this.unsubscribeDetector) {
      this.unsubscribeDetector();
      this.unsubscribeDetector = null;
    }
  }

  getIsObserving() {
    return this.isObserving;
  }

  onLogUpdate(callback: ObservationLogCallback) {
    this.logCallbacks.push(callback);
    return () => {
      this.logCallbacks = this.logCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyLog(log: VisionObservationLog) {
    this.logs.unshift(log);
    if (this.logs.length > 20) this.logs.pop();
    this.logCallbacks.forEach(cb => cb(log));
  }

  getLogs() {
    return this.logs;
  }

  // Convert VisionEvent to CreateEvidenceInput
  private convertEventToEvidenceInput(event: VisionEvent): CreateEvidenceInput {
    let type: EvidenceType = "GESTURE";
    let title = "Camera Observation";
    let description = `The courtroom observer detected ${event.event}.`;

    switch (event.event) {
      case "PERSON_PRESENT":
        type = "OBSERVATION";
        title = "Defendant Present";
        description = "The courtroom observer detected a person in the camera frame.";
        break;
      case "RIGHT_HAND_RAISED":
        type = "GESTURE";
        title = "Raised Right Hand";
        description = "The courtroom observer detected the defendant raising their right hand.";
        break;
      case "LEFT_HAND_RAISED":
        type = "GESTURE";
        title = "Raised Left Hand";
        description = "The courtroom observer detected the defendant raising their left hand.";
        break;
      case "BOTH_HANDS_RAISED":
        type = "GESTURE";
        title = "Both Hands Surrendered";
        description = "The courtroom observer detected the defendant raising both hands in surrender.";
        break;
      case "HAND_ON_HEAD":
        type = "GESTURE";
        title = "Hand on Head (Distress)";
        description = "The courtroom observer detected the defendant in apparent distress with hand on head.";
        break;
    }

    return {
      type,
      title,
      description,
      source: "CAMERA",
      metadata: {
        detector: event.detector,
        event: event.event,
        confidence: event.confidence,
        timestamp: event.timestamp,
        source: "CAMERA",
        ...event.metadata
      }
    };
  }

  // Handle incoming vision event with 5-second cooldown and state reset checks
  private async handleVisionEvent(event: VisionEvent) {
    if (!this.isObserving || !this.activeSessionId || this.isSessionClosed) {
      return;
    }

    const eventKey = event.event;
    const now = Date.now();
    const lastTrigger = this.cooldownMap[eventKey] || 0;
    const COOLDOWN_MS = 5000; // 5-second cooldown requirement

    // Duplicate event suppression & cooldown check
    if (now - lastTrigger < COOLDOWN_MS) {
      this.notifyLog({
        id: "log-" + Math.random().toString(36).substr(2, 6),
        event,
        status: "THROTTLED"
      });
      return;
    }

    // Update cooldown map & state tracker
    this.cooldownMap[eventKey] = now;
    this.activeStateMap[eventKey] = true;

    // Convert & submit to Evidence API
    const evidenceInput = this.convertEventToEvidenceInput(event);
    
    try {
      const createdItem = await addEvidence(this.activeSessionId, evidenceInput);
      this.notifyLog({
        id: "log-" + Math.random().toString(36).substr(2, 6),
        event,
        exhibit_number: createdItem.exhibit_number,
        status: "SUBMITTED"
      });
    } catch (err: any) {
      console.error("Failed to submit camera evidence:", err);
      this.notifyLog({
        id: "log-" + Math.random().toString(36).substr(2, 6),
        event,
        status: "DETECTED"
      });
    }
  }

  // Programmatic mock event helper for E2E testing
  async triggerMockEvent(eventType: VisionEventType, confidence = 0.91) {
    const event = gestureDetector.mockVisionEvent(eventType, confidence);
    return event;
  }
}

export const visionService = new VisionService();
