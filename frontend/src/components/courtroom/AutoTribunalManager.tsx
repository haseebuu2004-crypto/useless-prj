import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Eye, ShieldAlert, Loader2, Send, Scale, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useTribunalSession } from "../../hooks/useTribunalSession";
import { visionService } from "../../services/vision/visionService";
import { gestureDetector } from "../../services/vision/gestureDetector";
import { VisionEvent, VisionObservationLog } from "../../services/vision/visionTypes";
import VerdictDisplay from "../verdict/VerdictDisplay";
import * as api from "../../api/sessionApi";

export type AutoPhase = 
  | "CAMERA_INITIALIZING"
  | "SEARCHING_FOR_PERSON"
  | "PERSON_DETECTED"
  | "INITIAL_OBSERVATION"
  | "CASE_FILED"
  | "TRIAL_ACTIVE"
  | "DEFENSE"
  | "DELIBERATION"
  | "VERDICT"
  | "CLOSED";

function getEvidenceBadge(eventStr: string, defaultTitle?: string) {
  const s = (eventStr || defaultTitle || "").toUpperCase();
  if (s.includes("HAND_RAISED")) return { icon: "✋", text: "Right hand raised" };
  if (s.includes("HAND_ON_HEAD")) return { icon: "🤦", text: "Hand on head" };
  if (s.includes("LOOKING_AWAY")) return { icon: "👀", text: "Looking away" };
  if (s.includes("SAT_DOWN")) return { icon: "🪑", text: "Sat down" };
  if (s.includes("APPROACHED")) return { icon: "📷", text: "Approached the camera" };
  return { icon: "👤", text: defaultTitle || "Person in observation zone" };
}

export default function AutoTribunalManager() {
  const {
    session,
    loading,
    error,
    startSession,
    closeSession,
    resetSession,
  } = useTribunalSession();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<AutoPhase>("CAMERA_INITIALIZING");
  const [cameraStreamActive, setCameraStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [obsTimer, setObsTimer] = useState<number>(0);
  const [obsTargetDuration, setObsTargetDuration] = useState<number>(7.5);
  const [initialEvents, setInitialEvents] = useState<VisionEvent[]>([]);
  const [defenseText, setDefenseText] = useState<string>("");
  const [logs, setLogs] = useState<VisionObservationLog[]>([]);
  const [activeSessionData, setActiveSessionData] = useState<any>(null);

  // Start webcam stream on mount
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initCamera() {
      setPhase("CAMERA_INITIALIZING");
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError("Browser camera access is not supported.");
          setPhase("SEARCHING_FOR_PERSON");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraStreamActive(true);
        setPhase("SEARCHING_FOR_PERSON");
      } catch (err: any) {
        console.warn("Camera init failed:", err);
        setCameraError(err.message || "Camera access permission denied.");
        setPhase("SEARCHING_FOR_PERSON");
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Subscribe to visionService logs internally
  useEffect(() => {
    setLogs(visionService.getLogs());
    const unsub = visionService.onLogUpdate(() => {
      setLogs([...visionService.getLogs()]);
    });
    return () => unsub();
  }, []);

  // Listen to gestureDetector events during SEARCHING_FOR_PERSON & INITIAL_OBSERVATION
  useEffect(() => {
    const unsubDetector = gestureDetector.onEvent((event: VisionEvent) => {
      if (phase === "SEARCHING_FOR_PERSON") {
        setPhase("PERSON_DETECTED");
      } else if (phase === "INITIAL_OBSERVATION") {
        setInitialEvents(prev => [...prev, event]);
      }
    });

    return () => unsubDetector();
  }, [phase]);

  // Fallback timer for person detection
  useEffect(() => {
    if (phase === "SEARCHING_FOR_PERSON") {
      const t = setTimeout(() => {
        setPhase("PERSON_DETECTED");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Handle PERSON_DETECTED -> INITIAL_OBSERVATION transition
  useEffect(() => {
    if (phase === "PERSON_DETECTED") {
      const target = Number((5.0 + Math.random() * 4.0).toFixed(1));
      setObsTargetDuration(target);
      setObsTimer(0);
      setInitialEvents([]);
      setPhase("INITIAL_OBSERVATION");
    }
  }, [phase]);

  // Run INITIAL_OBSERVATION timer countdown
  useEffect(() => {
    if (phase === "INITIAL_OBSERVATION") {
      const interval = setInterval(() => {
        setObsTimer(prev => {
          const next = prev + 0.5;
          if (next >= obsTargetDuration) {
            clearInterval(interval);
            triggerAutomaticCaseFiling();
            return obsTargetDuration;
          }
          return next;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [phase, obsTargetDuration]);

  // Automatic Case Filing with Real Gemini AI Case Narrator
  const triggerAutomaticCaseFiling = useCallback(async () => {
    setPhase("CASE_FILED");
    try {
      // 1. Start new session
      const newSession = await startSession();
      const sId = newSession.session_id;
      activeSessionIdRef.current = sId;

      // 2. Format real MediaPipe CV observation facts
      const formattedObs = initialEvents.map((e, idx) => ({
        event: e.event,
        confidence: e.confidence,
        relative_time_seconds: Number((idx * 1.5).toFixed(1))
      }));

      // 3. Call real Gemini Case Narrator backend endpoint
      const result = await api.generateNarrative(sId, formattedObs, obsTargetDuration);
      
      // 4. Attach initial observation exhibit directly to backend
      await api.addEvidence(sId, {
        type: "OBSERVATION",
        title: "Initial Observer Deposition",
        description: `Preliminary observation sweep completed. Detected events: ${initialEvents.map(e => e.event).join(", ") || "PERSON_PRESENT"}.`,
        source: "CAMERA",
        metadata: {
          event: initialEvents[0]?.event || "PERSON_PRESENT",
          confidence: initialEvents[0]?.confidence || 0.94,
          source: "CAMERA"
        }
      });

      // 5. Update session data & vision observer
      setActiveSessionData(result.session);
      visionService.setSession(sId, false);
      visionService.startObservation();

      setPhase("TRIAL_ACTIVE");
    } catch (err: any) {
      console.error("Auto case creation failed:", err);
      // Explicit error state for retry (No fake local lookup fallback!)
      setCameraError(`Bro... court's AI clerk is stuck (${err.message || "Gemini error"}). Give it another try.`);
    }
  }, [startSession, initialEvents, obsTargetDuration]);

  // Handle Defense Submission
  const handleDefenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sId = activeSessionIdRef.current || session?.session_id;
    if (!defenseText.trim() || !sId) return;

    setPhase("DELIBERATION");
    try {
      // 1. Submit testimony directly using sId
      await api.submitTestimony(sId, {
        witness: "Defendant",
        statement: defenseText.trim()
      });

      // 2. Start deliberation directly using sId
      await api.startDeliberation(sId);

      // 3. Generate verdict directly using sId
      const finalVerdictSession = await api.generateVerdict(sId);
      setActiveSessionData(finalVerdictSession);

      setPhase("VERDICT");
    } catch (err) {
      console.error("Defense submission failed:", err);
    }
  };

  // Reset & Restart Automatic Tribunal
  const handleRestart = async () => {
    visionService.stopObservation();
    if (session?.session_id) {
      try { await closeSession(); } catch {}
    }
    resetSession();
    setDefenseText("");
    setInitialEvents([]);
    setObsTimer(0);
    setPhase("SEARCHING_FOR_PERSON");
  };

  // Determine current camera status string for clean visual overlay
  const getCameraStatusLabel = () => {
    switch (phase) {
      case "CAMERA_INITIALIZING":
        return "Opening camera feed...";
      case "SEARCHING_FOR_PERSON":
        return "Searching for defendant...";
      case "PERSON_DETECTED":
        return "Defendant detected.";
      case "INITIAL_OBSERVATION":
        const currentEvent = initialEvents[0]?.event || "PERSON_PRESENT";
        return `Observing ${currentEvent.replace(/_/g, " ").toLowerCase()}... (${Math.max(0, Math.ceil(obsTargetDuration - obsTimer))}s)`;
      case "CASE_FILED":
      case "TRIAL_ACTIVE":
      case "DEFENSE":
        return "Case filed. Courtroom camera active.";
      case "DELIBERATION":
        return "Court is deliberating...";
      default:
        return "COURT IS WATCHING 👁️";
    }
  };

  const currentSession = activeSessionData || session;

  return (
    <div className="max-w-3xl mx-auto w-full py-4 md:py-8 px-2">
      {/* Primary Header */}
      <div className="border-4 border-[#2b2b2b] p-6 bg-[#fcfbf9] shadow-[6px_6px_0_0_rgba(43,43,43,1)] mb-8 text-center relative overflow-hidden">
        <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-tight text-[#2b2b2b]">
          HUMAN TRIBUNAL
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-red-800 font-bold mt-2">
          "The court observes continuously. Defense is mandatory."
        </p>
      </div>

      {/* Main Camera Hero Stage */}
      {phase !== "VERDICT" && (
        <div className="border-4 border-[#2b2b2b] p-4 md:p-6 bg-[#fcfbf9] shadow-[8px_8px_0_0_rgba(43,43,43,1)] mb-8">
          <div className="relative rounded-none border-4 border-[#2b2b2b] bg-black overflow-hidden aspect-video max-w-2xl mx-auto flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraStreamActive ? 'block' : 'hidden'}`}
            />

            {/* Clean Status Overlay */}
            {cameraStreamActive && (
              <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none flex justify-between items-center">
                <span className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-red-400 bg-black/70 px-3 py-1 border border-red-500/50 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  COURT IS WATCHING 👁️
                </span>
                <span className="font-mono text-xs font-bold text-white bg-black/70 px-3 py-1 border border-white/30 uppercase">
                  {getCameraStatusLabel()}
                </span>
              </div>
            )}

            {/* Countdown Overlay during Observation */}
            {phase === "INITIAL_OBSERVATION" && (
              <div className="absolute inset-x-0 bottom-0 p-3 bg-black/80 border-t-2 border-red-800 text-center font-mono text-xs text-white">
                <span className="font-bold text-red-400 uppercase tracking-widest block mb-1">
                  OBSERVING YOUR BEHAVIOUR
                </span>
                <div className="w-full bg-gray-700 h-2 max-w-md mx-auto rounded-full overflow-hidden border border-white/20">
                  <div
                    className="bg-red-600 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((obsTimer / obsTargetDuration) * 100))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Offline State */}
            {!cameraStreamActive && (
              <div className="p-6 text-center text-red-400 font-mono text-xs uppercase flex flex-col items-center">
                <ShieldAlert className="w-10 h-10 mb-2 text-red-500" />
                <span className="font-bold text-sm tracking-wider">COURTROOM CAMERA OFFLINE</span>
                <span className="text-xs text-gray-400 mt-1">
                  {cameraError || "Grant camera access to enter the courtroom."}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 text-center font-mono text-[11px] text-gray-500 uppercase tracking-wider">
            🔒 Privacy: Processing occurs strictly in your browser. Zero video frames are recorded or saved.
          </div>
        </div>
      )}

      {/* Accusation & Defense Flow */}
      {(() => {
        if ((phase === "TRIAL_ACTIVE" || phase === "DEFENSE" || phase === "DELIBERATION" || phase === "CASE_FILED") && currentSession) {
          const caseTitle = currentSession.case_data?.title || "EXCESSIVE SUSPICIOUS STILLNESS";
          const caseAction = currentSession.case_data?.action || "Bro, court noticed you standing in the observation zone for absolutely no legally acceptable reason.";

          const displayEvidences: Array<{ icon: string; text: string }> = [];
          if (initialEvents.length > 0) {
            initialEvents.forEach(e => displayEvidences.push(getEvidenceBadge(e.event)));
          } else if (logs.length > 0) {
            logs.forEach(l => displayEvidences.push(getEvidenceBadge(l.event.event)));
          } else {
            displayEvidences.push({ icon: "👤", text: "Defendant present in observation zone" });
          }

          const defensePrompt = currentSession.case_data?.defense_prompt || "Tell the court what actually happened...";
          const deliberationText = "Evaluating defendant testimony against physical camera exhibits...";

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-4 border-[#2b2b2b] p-6 md:p-8 bg-[#fcfbf9] shadow-[8px_8px_0_0_rgba(43,43,43,1)] mb-8"
            >
              {/* Accusation Banner */}
              <div className="border-b-4 border-double border-[#2b2b2b] pb-4 mb-6 text-center md:text-left">
                <span className="font-mono text-xs font-bold uppercase bg-red-800 text-white px-3 py-1 inline-block mb-3">
                  ⚠️ CASE FILED
                </span>
                <h2 className="font-serif text-2xl md:text-3xl font-bold uppercase tracking-tight text-[#2b2b2b] mb-2">
                  "{caseTitle}"
                </h2>
                <p className="font-sans font-medium text-lg text-[#2b2b2b] bg-white border-2 border-[#2b2b2b] p-4 mt-3">
                  "{caseAction}"
                </p>
              </div>

              {/* Observed Evidence Section */}
              <div className="mb-6">
                <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-gray-700 mb-3">
                  Observed Courtroom Evidence:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {displayEvidences.map((ev, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-white border-2 border-[#2b2b2b] px-3 py-1.5 shadow-[2px_2px_0_0_rgba(43,43,43,1)]"
                    >
                      <span>{ev.icon}</span>
                      <span>{ev.text}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Defense Section */}
              {phase !== "DELIBERATION" ? (
                <form onSubmit={handleDefenseSubmit} className="space-y-4 pt-4 border-t-2 border-dashed border-[#2b2b2b]">
                  <div>
                    <label className="block font-sans text-lg font-bold text-[#2b2b2b] mb-1">
                      {defensePrompt}
                    </label>
                    <span className="block font-mono text-xs text-gray-500 uppercase mb-3">
                      Tell the court what actually happened...
                    </span>
                    <textarea
                      rows={4}
                      required
                      value={defenseText}
                      onChange={(e) => setDefenseText(e.target.value)}
                      placeholder="Tell the court what actually happened..."
                      className="w-full bg-white border-2 border-[#2b2b2b] p-4 font-sans text-base focus:outline-none focus:border-red-800 resize-none shadow-inner"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !defenseText.trim()}
                      className="flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 font-mono font-bold text-sm uppercase tracking-widest text-white bg-red-800 hover:bg-[#2b2b2b] transition-colors border-2 border-transparent shadow-[4px_4px_0_0_rgba(43,43,43,1)] disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      DEFEND YOURSELF
                    </button>
                  </div>
                </form>
              ) : (
                /* Deliberation Stage */
                <div className="border-4 border-[#2b2b2b] p-8 text-center bg-white font-mono text-xs uppercase space-y-3 shadow-inner my-4">
                  <Loader2 className="w-10 h-10 animate-spin text-red-800 mx-auto" />
                  <span className="font-serif text-2xl font-bold text-[#2b2b2b] block">
                    ⚖️ THE COURT IS THINKING...
                  </span>
                  <span className="text-gray-600 block">
                    {deliberationText}
                  </span>
                </div>
              )}
            </motion.div>
          );
        }
        return null;
      })()}

      {/* Verdict Screen */}
      {(() => {
        if (phase === "VERDICT" && currentSession?.verdict) {
          return (
            <div className="mb-8">
              <VerdictDisplay
                verdict={{
                  caseNumber: currentSession.verdict.caseNumber,
                  charges: currentSession.verdict.charges,
                  reasoning: currentSession.verdict.reasoning || (currentSession.verdict as any).reason,
                  finalVerdict: currentSession.verdict.decision || (currentSession.verdict as any).finalVerdict,
                  sentence: currentSession.verdict.sentence,
                  decision: currentSession.verdict.decision,
                  confidence: currentSession.verdict.confidence,
                  provider: currentSession.verdict.provider,
                  model: currentSession.verdict.model,
                  fallback_reason: currentSession.verdict.fallback_reason,
                  evidence_assessment: currentSession.verdict.evidence_assessment,
                  testimony_assessment: currentSession.verdict.testimony_assessment,
                  absurdity_context: currentSession.verdict.absurdity_context,
                }}
                onBack={handleRestart}
                onCloseSession={handleRestart}
              />
            </div>
          );
        }
        return null;
      })()}

      {error && (
        <div className="border-2 border-red-800 bg-red-50 p-4 font-mono text-xs text-red-800 font-bold uppercase mb-6 text-center">
          ⚠️ TRIBUNAL ERROR: {error}
        </div>
      )}
    </div>
  );
}


