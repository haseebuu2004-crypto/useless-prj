import { Gavel, Camera, UserCheck, Scale, RefreshCw, Play } from "lucide-react";
import { TribunalStatus } from "../../types";

interface DemoControlPanelProps {
  status: TribunalStatus;
  judgeProvider?: "mock" | "local-llm";
  isObserving?: boolean;
  isLoading?: boolean;
  onStartDemo: () => void;
  onSimulateCameraObservation: () => void;
  onCallWitness: () => void;
  onBeginDeliberation: () => void;
  onResetDemo: () => void;
}

const STATUS_ORDER: Record<TribunalStatus, number> = {
  LOBBY: 0,
  CASE_FILED: 1,
  EVIDENCE: 2,
  TESTIMONY: 3,
  DELIBERATION: 4,
  VERDICT: 5,
  CLOSED: 6,
};

export default function DemoControlPanel({
  status,
  judgeProvider = "mock",
  isObserving = false,
  isLoading = false,
  onStartDemo,
  onSimulateCameraObservation,
  onCallWitness,
  onBeginDeliberation,
  onResetDemo,
}: DemoControlPanelProps) {
  const step = STATUS_ORDER[status];

  // Contextual enable/disable logic
  const canStartDemo = step === 0; // LOBBY
  const canSimulateCamera = step >= 2 && step <= 3; // EVIDENCE or TESTIMONY
  const canCallWitness = step >= 2 && step <= 3; // EVIDENCE or TESTIMONY
  const canBeginDeliberation = step >= 2 && step <= 3; // EVIDENCE or TESTIMONY
  const canReset = step > 0; // anything past LOBBY

  const btnBase =
    "w-full flex items-center gap-3 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#2b2b2b] transition-colors focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed";
  const btnPrimary = `${btnBase} bg-[#2b2b2b] text-[#fcfbf9] hover:bg-red-900`;
  const btnSecondary = `${btnBase} bg-[#fcfbf9] text-[#2b2b2b] hover:bg-[#2b2b2b] hover:text-[#fcfbf9]`;
  const btnDanger = `${btnBase} bg-white text-red-800 border-red-800 hover:bg-red-800 hover:text-white`;

  return (
    <div className="max-w-5xl mx-auto w-full mb-6">
      <div className="border-2 border-[#2b2b2b] bg-[#fcfbf9] shadow-[4px_4px_0_0_rgba(43,43,43,1)]">

        {/* Header */}
        <div className="border-b-2 border-[#2b2b2b] px-4 py-3 flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#2b2b2b]">
            <Gavel className="w-3.5 h-3.5 text-red-800" />
            COURT CLERK CONTROLS
          </span>
          <span className="font-mono text-[10px] font-bold uppercase bg-red-800 text-white px-2 py-0.5 tracking-wider">
            DEMO SEQUENCE
          </span>
        </div>

        {/* Live Status Row */}
        <div className="border-b border-[#2b2b2b] px-4 py-2 grid grid-cols-3 gap-2 bg-white/60">
          {/* Court Status */}
          <div className="font-mono text-[10px]">
            <span className="text-gray-500 uppercase block font-bold tracking-wider mb-0.5">COURT STATUS</span>
            {status === "LOBBY" ? (
              <span className="flex items-center gap-1 text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                STANDBY
              </span>
            ) : status === "CLOSED" ? (
              <span className="flex items-center gap-1 text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 inline-block" />
                ARCHIVED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-800 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse inline-block" />
                CASE ACTIVE
              </span>
            )}
          </div>

          {/* Observer Status */}
          <div className="font-mono text-[10px]">
            <span className="text-gray-500 uppercase block font-bold tracking-wider mb-0.5">OBSERVER</span>
            {isObserving ? (
              <span className="flex items-center gap-1 text-red-800 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping inline-block" />
                WATCHING
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                STANDBY
              </span>
            )}
          </div>

          {/* Judge Status */}
          <div className="font-mono text-[10px]">
            <span className="text-gray-500 uppercase block font-bold tracking-wider mb-0.5">JUDGE</span>
            {judgeProvider === "local-llm" ? (
              <span className="flex items-center gap-1 text-emerald-800 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                LOCAL AI
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-800 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                FALLBACK
              </span>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {/* 1. Start Demo */}
          <button
            id="demo-btn-start"
            onClick={onStartDemo}
            disabled={!canStartDemo || isLoading}
            className={btnPrimary}
            title="Step 1 — File THE MIDNIGHT CAKE INCIDENT and load Exhibit A"
          >
            <Play className="w-4 h-4 flex-shrink-0" />
            <span>START DEMO</span>
          </button>

          {/* 2. Simulate Camera Observation */}
          <button
            id="demo-btn-camera"
            onClick={onSimulateCameraObservation}
            disabled={!canSimulateCamera || isLoading}
            className={btnSecondary}
            title="Step 3 — Simulate RIGHT_HAND_RAISED (not from real camera)"
          >
            <Camera className="w-4 h-4 flex-shrink-0" />
            <span className="text-left leading-tight">
              ENTER CAMERA<br className="hidden sm:block" />
              <span className="text-[9px] font-normal">(SIMULATED)</span>
            </span>
          </button>

          {/* 3. Call Witness */}
          <button
            id="demo-btn-witness"
            onClick={onCallWitness}
            disabled={!canCallWitness || isLoading}
            className={btnSecondary}
            title="Step 4 — Record Roommate testimony about suspicious 3 AM chewing"
          >
            <UserCheck className="w-4 h-4 flex-shrink-0" />
            <span>CALL WITNESS</span>
          </button>

          {/* 4. Begin Deliberation */}
          <button
            id="demo-btn-deliberate"
            onClick={onBeginDeliberation}
            disabled={!canBeginDeliberation || isLoading}
            className={btnPrimary}
            title="Step 5 — Begin AI Judge deliberation"
          >
            <Scale className="w-4 h-4 flex-shrink-0" />
            <span>BEGIN<br className="hidden sm:block" />DELIBERATION</span>
          </button>

          {/* 5. Reset Case */}
          <button
            id="demo-btn-reset"
            onClick={onResetDemo}
            disabled={!canReset || isLoading}
            className={btnDanger}
            title="Reset — Close session and return to lobby for immediate replay"
          >
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            <span>RESET CASE</span>
          </button>
        </div>

        {/* Demo Script Step Display */}
        <div className="border-t border-dashed border-[#2b2b2b] px-4 py-2 bg-white/30">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider">
            DEMO SEQUENCE →
          </span>
          <div className="flex flex-wrap gap-x-4 mt-0.5">
            {[
              { step: 0, label: "01 START", active: step === 0 },
              { step: 1, label: "02 EXHIBIT A", active: step >= 1 && step <= 2 },
              { step: 2, label: "03 CAMERA", active: step === 2 },
              { step: 3, label: "04 WITNESS", active: step === 3 },
              { step: 4, label: "05 DELIBERATION", active: step === 4 },
              { step: 5, label: "06 VERDICT", active: step === 5 },
              { step: 6, label: "07 RESET", active: step === 6 },
            ].map(({ label, active, step: s }) => (
              <span
                key={s}
                className={`font-mono text-[9px] uppercase font-bold ${
                  step > s ? "text-green-700" : active ? "text-red-800" : "text-gray-400"
                }`}
              >
                {step > s ? "✓" : active ? "●" : "○"} {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
