import { Check, Scale } from "lucide-react";
import { TribunalStatus } from "../../types";

interface TribunalProgressProps {
  status: TribunalStatus;
  absurdityMode?: boolean;
  onToggleAbsurdity?: () => void;
}

const PHASES: Array<{ id: TribunalStatus; label: string; number: string }> = [
  { id: "LOBBY", label: "LOBBY", number: "01" },
  { id: "CASE_FILED", label: "ACCUSATION", number: "02" },
  { id: "EVIDENCE", label: "EXHIBITS", number: "03" },
  { id: "TESTIMONY", label: "DEPOSITIONS", number: "04" },
  { id: "DELIBERATION", label: "DELIBERATION", number: "05" },
  { id: "VERDICT", label: "RULING", number: "06" },
  { id: "CLOSED", label: "ARCHIVED", number: "07" },
];

const PHASE_ORDER: Record<TribunalStatus, number> = {
  LOBBY: 0,
  CASE_FILED: 1,
  EVIDENCE: 2,
  TESTIMONY: 3,
  DELIBERATION: 4,
  VERDICT: 5,
  CLOSED: 6,
};

export default function TribunalProgress({ status, absurdityMode = true, onToggleAbsurdity }: TribunalProgressProps) {
  const currentIndex = PHASE_ORDER[status] ?? 0;

  return (
    <div className="max-w-5xl mx-auto w-full mb-8">
      <div className="border-2 border-[#2b2b2b] bg-[#fcfbf9] p-3 shadow-[4px_4px_0_0_rgba(43,43,43,1)]">
        <div className="flex flex-wrap items-center justify-between border-b border-gray-300 pb-2 mb-3 px-2 gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 text-[#2b2b2b]">
            <Scale className="w-3.5 h-3.5 text-red-800" /> TRIBUNAL SESSION PROGRESSION
          </span>

          <div className="flex items-center gap-2">
            {onToggleAbsurdity && (
              <button
                onClick={onToggleAbsurdity}
                title="Toggle Absurdity Engine Mode"
                className={`font-mono text-[10px] font-bold uppercase border px-2 py-0.5 tracking-wider transition-colors ${
                  absurdityMode 
                    ? 'bg-[#2b2b2b] text-white border-[#2b2b2b]' 
                    : 'bg-gray-200 text-gray-700 border-gray-400'
                }`}
              >
                ABSURDITY ENGINE: {absurdityMode ? "ON" : "OFF"}
              </button>
            )}

            <span className="font-mono text-[10px] font-bold uppercase bg-red-900 text-white px-2 py-0.5 tracking-wider">
              PHASE {currentIndex + 1} OF {PHASES.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 font-mono text-xs">
          {PHASES.map((phase, idx) => {
            const isCurrent = phase.id === status;
            const isCompleted = idx < currentIndex;

            let badgeStyle = "border border-gray-300 text-gray-400 bg-white/50 opacity-60";
            if (isCurrent) {
              badgeStyle = "border-2 border-[#2b2b2b] bg-[#2b2b2b] text-[#fcfbf9] font-bold shadow-sm";
            } else if (isCompleted) {
              badgeStyle = "border border-green-900 bg-green-50 text-green-950 font-bold";
            }

            return (
              <div
                key={phase.id}
                className={`p-2 transition-all flex flex-col justify-between ${badgeStyle}`}
              >
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="opacity-70">{phase.number}</span>
                  {isCompleted && <Check className="w-3 h-3 text-green-700" />}
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                </div>
                <span className="font-bold truncate text-[11px] uppercase tracking-wider">
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
