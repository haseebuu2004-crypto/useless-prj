import { motion } from "motion/react";
import { Verdict } from "../../types";

interface VerdictDisplayProps {
  verdict: Verdict;
  onBack: () => void;
  onCloseSession?: () => void;
}

export default function VerdictDisplay({ verdict, onBack, onCloseSession }: VerdictDisplayProps) {
  const decision = verdict.decision || verdict.finalVerdict || "GUILTY";
  const isGuilty = decision === "GUILTY";
  
  const caseNumber = verdict.caseNumber || "042";
  const verdictLine = verdict.verdict_line || `Under this section, you are officially guilty of ${verdict.charges || "suspicious behavior"}.`;
  
  // Fallback to reasoning if judge_note is missing (e.g. from mock provider or older sessions)
  const judgeNote = verdict.judge_note || 
    (Array.isArray(verdict.reasoning) && verdict.reasoning.length > 0 
      ? verdict.reasoning.join(" ") 
      : "The Court has reviewed the evidence. The explanation is insufficient.");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto w-full py-8 md:py-12 px-4"
    >
      <div className="bg-[#fcfbf9] border-2 border-[#1a1a1a] p-8 md:p-12 shadow-[8px_8px_0_0_rgba(26,26,26,1)]">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-3xl mb-4">⚖️</div>
          <h2 className="font-serif text-3xl font-bold tracking-widest text-[#1a1a1a] uppercase mb-2">
            FINAL VERDICT
          </h2>
          <p className="font-mono text-sm tracking-widest text-gray-600">
            CASE #{caseNumber}
          </p>
        </div>

        <div className="border-t border-[#1a1a1a] my-8"></div>

        {/* Decision */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-5xl font-bold tracking-wider text-[#1a1a1a] mb-6">
            {decision}
          </h1>
          {isGuilty && (
            <div className="font-sans text-base text-gray-800 max-w-md mx-auto leading-relaxed">
              {verdictLine}
            </div>
          )}
        </div>

        <div className="border-t border-[#1a1a1a] my-8"></div>

        {/* Judge's Note */}
        <div className="mb-10 text-center">
          <h3 className="font-mono text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">
            JUDGE'S NOTE
          </h3>
          <p className="font-sans text-lg text-[#1a1a1a] italic leading-relaxed max-w-lg mx-auto">
            "{judgeNote}"
          </p>
        </div>

        <div className="border-t border-[#1a1a1a] my-8"></div>

        {/* Punishment */}
        <div className="text-center mb-10">
          <h3 className="font-mono text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">
            PUNISHMENT
          </h3>
          <p className="font-serif text-2xl font-medium text-[#1a1a1a]">
            {isGuilty ? verdict.sentence : "None. You may leave."}
          </p>
        </div>

        <div className="border-t border-[#1a1a1a] my-8"></div>

        {/* Footer / Action */}
        <div className="text-center mt-8">
          <p className="font-mono text-sm tracking-widest text-[#1a1a1a] uppercase font-bold mb-6">
            CASE CLOSED
          </p>
          <button
            onClick={onCloseSession || onBack}
            className="font-mono text-sm tracking-widest uppercase text-[#1a1a1a] border-2 border-[#1a1a1a] px-8 py-3 hover:bg-[#1a1a1a] hover:text-[#fcfbf9] transition-colors focus:outline-none"
          >
            [ RETURN HOME ]
          </button>
        </div>
        
      </div>
    </motion.div>
  );
}

