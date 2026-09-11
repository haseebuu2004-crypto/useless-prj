import { useState, useEffect, useRef } from "react";
import { Camera, Eye, EyeOff, Video, VideoOff, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { visionService } from "../../services/vision/visionService";
import { gestureDetector } from "../../services/vision/gestureDetector";
import { VisionObservationLog, VisionObserverStatus } from "../../services/vision/visionTypes";

interface CourtroomCameraProps {
  sessionId: string | null;
  isSessionClosed?: boolean;
  onObservingChange?: (observing: boolean) => void;
  showMockControls?: boolean;
}

export default function CourtroomCamera({ sessionId, isSessionClosed = false, onObservingChange, showMockControls = false }: CourtroomCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [observerStatus, setObserverStatus] = useState<VisionObserverStatus>("IDLE");
  const [logs, setLogs] = useState<VisionObservationLog[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasWebcam, setHasWebcam] = useState<boolean>(true);

  // Sync session state to vision service and auto-start camera observation on mount
  useEffect(() => {
    visionService.setSession(sessionId, isSessionClosed);
    if (isSessionClosed || !sessionId) {
      setObserverStatus("IDLE");
    } else if (observerStatus === "IDLE") {
      // Auto-attempt camera start on session start
      handleToggleObservation();
    }
  }, [sessionId, isSessionClosed]);

  // Subscribe to log updates
  useEffect(() => {
    setLogs(visionService.getLogs());
    const unsubscribe = visionService.onLogUpdate(() => {
      setLogs([...visionService.getLogs()]);
    });
    return () => unsubscribe();
  }, []);

  // Request camera permission and start video stream
  const startCameraStream = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasWebcam(false);
        setErrorMessage("Browser does not support media device camera access.");
        setObserverStatus("ERROR");
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (err: any) {
      console.warn("Camera stream access failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setObserverStatus("PERMISSION_DENIED");
        setErrorMessage("Courtroom camera permission was denied by the user.");
      } else {
        setHasWebcam(false);
        setObserverStatus("ERROR");
        setErrorMessage("No active courtroom camera device was found.");
      }
      return false;
    }
  };

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleToggleObservation = async () => {
    if (observerStatus === "OBSERVING") {
      visionService.stopObservation();
      stopCameraStream();
      setObserverStatus("IDLE");
      onObservingChange?.(false);
    } else {
      if (!sessionId || isSessionClosed) return;
      const success = await startCameraStream();
      if (success) {
        visionService.startObservation();
        setObserverStatus("OBSERVING");
        onObservingChange?.(true);
      }
    }
  };

  return (
    <div className="border-4 border-[#2b2b2b] p-6 bg-[#fcfbf9] shadow-[6px_6px_0_0_rgba(43,43,43,1)] mb-8">
      {/* Header */}
      <div className="border-b-2 border-[#2b2b2b] pb-4 mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-red-800" />
          <h3 className="font-serif font-bold text-xl uppercase tracking-tight">
            Courtroom Observer (CV Camera)
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {observerStatus === "OBSERVING" ? (
            <span className="flex items-center gap-2 font-mono text-xs font-bold uppercase bg-red-800 text-white px-3 py-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              OBSERVING ACTIVE
            </span>
          ) : (
            <span className="font-mono text-xs font-bold bg-gray-200 text-[#2b2b2b] px-3 py-1 uppercase">
              OBSERVER INACTIVE
            </span>
          )}

          <button
            onClick={handleToggleObservation}
            disabled={!sessionId || isSessionClosed}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors border-2 border-[#2b2b2b] focus:outline-none flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
              observerStatus === "OBSERVING" 
                ? "bg-red-800 text-white hover:bg-[#2b2b2b]" 
                : "bg-[#2b2b2b] text-[#fcfbf9] hover:bg-red-800"
            }`}
          >
            {observerStatus === "OBSERVING" ? (
              <>
                <EyeOff className="w-4 h-4" /> Stop Observer
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" /> Enable Observer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Video Preview & Log Grid */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Live Video Feed */}
        <div className="border-2 border-[#2b2b2b] bg-black relative min-h-[220px] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${observerStatus === "OBSERVING" ? "block" : "hidden"}`}
          />

          {observerStatus === "OBSERVING" && (
            <div className="absolute inset-0 pointer-events-none border border-red-500/30 flex items-center justify-center">
              <div className="w-16 h-16 border border-dashed border-red-500/50 rounded-full animate-ping"></div>
              <span className="absolute top-2 left-2 font-mono text-[10px] text-red-400 font-bold uppercase tracking-widest bg-black/80 px-2 py-0.5">
                ● THE COURT IS WATCHING (LOCAL CV)
              </span>
            </div>
          )}

          {observerStatus !== "OBSERVING" && (
            <div className="p-6 text-center text-gray-400 font-mono text-xs uppercase">
              {observerStatus === "PERMISSION_DENIED" ? (
                <div className="text-red-400 flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 mb-2 text-red-500" />
                  <span className="font-bold tracking-wider">THE COURTROOM OBSERVER IS BLIND</span>
                  <span className="text-[10px] mt-1 text-gray-400">Camera permission denied. Use mock controls below to simulate courtroom gestures.</span>
                </div>
              ) : observerStatus === "ERROR" ? (
                <div className="text-red-400 flex flex-col items-center">
                  <VideoOff className="w-8 h-8 mb-2 text-red-500" />
                  <span className="font-bold tracking-wider">THE COURT HAS LOST CONTACT WITH THE CAMERA</span>
                  <span className="text-[10px] mt-1 text-gray-400">{errorMessage || "No active webcam device found."}</span>
                </div>
              ) : !sessionId || isSessionClosed ? (
                <div className="flex flex-col items-center opacity-60">
                  <Video className="w-8 h-8 mb-2" />
                  <span>Tribunal Session Inactive or Closed</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Video className="w-8 h-8 mb-2 text-gray-400" />
                  <span className="font-bold text-[#2b2b2b]">CLICK "ENABLE OBSERVER" TO BEGIN VISION EVALUATION</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Courtroom Observer Ticker & Detections */}
        <div className="border-2 border-[#2b2b2b] p-4 bg-white min-h-[220px] flex flex-col justify-between">
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest border-b border-[#2b2b2b] pb-2 mb-3 flex justify-between items-center">
              <span>Courtroom Observation Ticker</span>
              <span className="text-[10px] text-red-800 font-normal">Auto-Debounced</span>
            </h4>

            {logs.length === 0 ? (
              <div className="text-center py-8 font-mono text-xs text-gray-400 uppercase italic">
                No observations recorded yet. Activate observer or test mock gestures below.
              </div>
            ) : (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="border border-[#2b2b2b] p-2 bg-[#fcfbf9] text-xs font-mono">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold uppercase text-red-800">
                        {log.event.event.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(log.event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span>Confidence: {Math.round(log.event.confidence * 100)}%</span>
                      {log.status === "SUBMITTED" ? (
                        <span className="bg-red-800 text-white font-bold px-1 py-0.5 uppercase">
                          ENTERED AS {log.exhibit_number}
                        </span>
                      ) : log.status === "THROTTLED" ? (
                        <span className="text-gray-400 uppercase">COOLDOWN THROTTLED</span>
                      ) : (
                        <span className="text-gray-600 uppercase">DETECTED</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Mock Control Toolbar for Manual Browser Testing (Demo Mode Only) */}
          {showMockControls && (
            <div className="mt-4 pt-3 border-t border-dashed border-[#2b2b2b]">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider block text-gray-500 mb-2">
                Mock Gesture Test Controls (Demo Mode Only)
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => visionService.triggerMockEvent("RIGHT_HAND_RAISED", 0.91)}
                  disabled={!sessionId || isSessionClosed}
                  className="px-2 py-1 font-mono text-[10px] uppercase font-bold bg-white border border-[#2b2b2b] hover:bg-red-800 hover:text-white transition-colors disabled:opacity-40"
                >
                  + Raise Right Hand
                </button>
                <button
                  type="button"
                  onClick={() => visionService.triggerMockEvent("BOTH_HANDS_RAISED", 0.93)}
                  disabled={!sessionId || isSessionClosed}
                  className="px-2 py-1 font-mono text-[10px] uppercase font-bold bg-white border border-[#2b2b2b] hover:bg-red-800 hover:text-white transition-colors disabled:opacity-40"
                >
                  + Raise Both Hands
                </button>
                <button
                  type="button"
                  onClick={() => visionService.triggerMockEvent("PERSON_PRESENT", 0.96)}
                  disabled={!sessionId || isSessionClosed}
                  className="px-2 py-1 font-mono text-[10px] uppercase font-bold bg-white border border-[#2b2b2b] hover:bg-red-800 hover:text-white transition-colors disabled:opacity-40"
                >
                  + Person Present
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
