import { Scale } from "lucide-react";

/**
 * DemoBanner — shown at the very top of the page when ?demo=true is active.
 * Kept minimal so it doesn't obscure the main tribunal UI.
 */
export default function DemoBanner() {
  return (
    <div className="max-w-5xl mx-auto w-full mb-3">
      <div
        className="border-2 border-[#2b2b2b] bg-[#2b2b2b] text-[#fcfbf9] px-4 py-2 flex items-center justify-between shadow-[4px_4px_0_0_rgba(200,0,0,0.7)]"
      >
        <span className="font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-red-400" />
          <span className="text-red-400">⚖</span>{" "}
          COMPETITION DEMO MODE — ACTIVE
        </span>
        <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider hidden sm:block">
          Human Tribunal v1 · Live Demonstration
        </span>
      </div>
    </div>
  );
}
