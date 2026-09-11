import { motion } from "motion/react";
import { Home as HomeIcon, CheckCircle2, ShieldAlert } from "lucide-react";
import { TribunalSession } from "../../types";

interface SessionClosedProps {
  session: TribunalSession;
  onReturnToLobby: () => void;
}

export default function SessionClosed({ session, onReturnToLobby }: SessionClosedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto w-full py-8"
    >
      <div className="border-4 border-[#2b2b2b] p-8 md:p-12 relative bg-[#fcfbf9] shadow-[12px_12px_0_0_rgba(43,43,43,1)]">
        {/* Closed Stamp Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 2, rotate: 15 }}
          animate={{ opacity: 1, scale: 1, rotate: 12 }}
          className="absolute -top-6 -right-6 pointer-events-none z-10"
        >
          <div className="border-4 border-[#2b2b2b] text-[#2b2b2b] font-mono font-bold text-3xl md:text-5xl uppercase tracking-widest px-6 py-2 opacity-90 mix-blend-multiply bg-red-100">
            CASE CLOSED
          </div>
        </motion.div>

        <div className="border-b-2 border-[#2b2b2b] pb-4 mb-8 flex justify-between items-end">
          <div>
            <h2 className="font-serif text-3xl font-bold uppercase tracking-tight">
              Archived Record
            </h2>
            <p className="font-mono text-xs uppercase mt-1 tracking-widest text-gray-500">
              Session Ref: {session.session_id}
            </p>
          </div>
          <span className="font-mono text-xs font-bold bg-[#2b2b2b] text-[#fcfbf9] px-3 py-1 uppercase">
            STATUS: CLOSED
          </span>
        </div>

        <div className="space-y-6 font-sans text-base leading-relaxed">
          {session.case_data && (
            <div className="border-2 border-[#2b2b2b] p-4 bg-white">
              <span className="font-mono text-xs font-bold uppercase text-red-800 block mb-1">
                Case Summary
              </span>
              <h3 className="font-bold text-lg">{session.case_data.title}</h3>
              <p className="text-sm font-medium text-gray-700">{session.case_data.action}</p>
            </div>
          )}

          {session.verdict && (
            <div className="border-2 border-[#2b2b2b] p-4 bg-[#2b2b2b] text-[#fcfbf9]">
              <span className="font-mono text-xs font-bold uppercase text-red-400 block mb-1">
                Final Verdict & Sentence
              </span>
              <h4 className="font-bold text-xl uppercase underline decoration-2 decoration-red-500 mb-2">
                {session.verdict.finalVerdict || session.verdict.decision}
              </h4>
              <p className="text-sm">{session.verdict.sentence || (Array.isArray(session.verdict.reasoning) ? session.verdict.reasoning.join(' ') : session.verdict.reasoning)}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 font-mono text-xs text-gray-600">
            <div className="border border-[#2b2b2b] p-3">
              <span className="font-bold block">Exhibits Logged:</span> {session.evidence.length}
            </div>
            <div className="border border-[#2b2b2b] p-3">
              <span className="font-bold block">Testimonies Recorded:</span> {session.testimony.length}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center border-t-2 border-[#2b2b2b] border-dashed pt-8">
          <button
            onClick={onReturnToLobby}
            className="flex items-center gap-3 px-8 py-4 font-mono font-bold uppercase tracking-widest text-[#fcfbf9] bg-[#2b2b2b] hover:bg-red-800 transition-colors border-2 border-transparent focus:outline-none"
          >
            <HomeIcon className="w-5 h-5" /> Return to Lobby
          </button>
        </div>
      </div>
    </motion.div>
  );
}
