import { motion } from "motion/react";
import { FileText, Scale, Loader2, AlertTriangle } from "lucide-react";

interface HomeProps {
  onFileCase: () => void;
  onViewRecentCases: () => void;
  sessionId?: string | null;
  isLoadingSession?: boolean;
  sessionError?: string | null;
  isDemoMode?: boolean;
}

export default function Home({ 
  onFileCase, 
  onViewRecentCases,
  sessionId,
  isLoadingSession,
  sessionError,
  isDemoMode = false
}: HomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center"
    >
      <div className="border-4 border-[#2b2b2b] p-8 md:p-16 relative bg-[#fcfbf9] shadow-[8px_8px_0_0_rgba(43,43,43,1)] w-full">
        {/* Court Status Indicator */}
        <div className="absolute top-4 left-4 flex items-center space-x-2 border-b-2 border-[#2b2b2b] pb-1">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#2b2b2b]">
            {sessionId ? `Session Active: ${sessionId}` : "Court Status: In Session"}
          </span>
        </div>

        <div className="absolute top-4 right-4 text-right">
          <p className="font-mono text-xs uppercase tracking-wider">
            Doc Ref: {sessionId || `${Math.floor(Math.random() * 10000)}-HT`}
            <br />
            {new Date().toISOString().split("T")[0]}
          </p>
        </div>

        <div className="mt-12 mb-8">
          <Scale className="w-16 h-16 mx-auto mb-6 text-[#2b2b2b]" strokeWidth={1.5} />
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-4">
            Human Tribunal
          </h1>
          <div className="w-full h-1 bg-[#2b2b2b] my-6"></div>
          <p className="font-mono text-lg md:text-xl uppercase tracking-widest text-red-800 font-bold max-w-lg mx-auto">
            "Where questionable human decisions meet due process."
          </p>
        </div>

        {sessionError && (
          <div className="mb-6 p-4 border-2 border-red-800 bg-red-50 text-red-800 font-mono text-xs text-left flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase block mb-1">Bureaucratic Exception Error</span>
              <p>{sessionError}</p>
            </div>
          </div>
        )}

        {isDemoMode ? (
          // Demo Mode: point presenter to the Clerk Controls panel
          <div className="mt-8 border-2 border-dashed border-[#2b2b2b] p-6 bg-white/60 text-center space-y-3">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#2b2b2b]">
              ⚖ Competition Demo Mode Active
            </p>
            <p className="font-sans text-base text-gray-700">
              Use the <span className="font-bold text-red-800">[ START DEMO ]</span> button in the{" "}
              <span className="font-bold">COURT CLERK CONTROLS</span> panel above to begin.
            </p>
            <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">
              Case: THE MIDNIGHT CAKE INCIDENT will be pre-loaded automatically.
            </p>
            <button
              onClick={onViewRecentCases}
              className="mt-2 px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#2b2b2b] border border-[#2b2b2b] hover:bg-[#2b2b2b] hover:text-[#fcfbf9] transition-colors"
            >
              View Recent Cases
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
            <button
              onClick={onFileCase}
              disabled={isLoadingSession}
              className="group relative px-8 py-4 font-mono font-bold uppercase tracking-widest text-[#fcfbf9] bg-[#2b2b2b] hover:bg-red-800 transition-colors border-2 border-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-3">
                {isLoadingSession ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initializing Session...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    File A Case
                  </>
                )}
              </span>
            </button>
            
            <button
              onClick={onViewRecentCases}
              className="px-8 py-4 font-mono font-bold uppercase tracking-widest text-[#2b2b2b] border-2 border-[#2b2b2b] hover:bg-[#2b2b2b] hover:text-[#fcfbf9] transition-colors focus:outline-none"
            >
              View Recent Cases
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

