import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, RefreshCw, Gavel } from "lucide-react";
import { FullCase } from "../../types";

interface RecentCasesProps {
  onBack: () => void;
}

export default function RecentCases({ onBack }: RecentCasesProps) {
  const [cases, setCases] = useState<FullCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cases")
      .then((res) => res.json())
      .then((data) => {
        setCases(data);
        setLoading(false);
      });

    const eventSource = new EventSource("/api/live-updates");
    eventSource.onmessage = (event) => {
      const newCase = JSON.parse(event.data);
      setCases((prev) => [newCase, ...prev].slice(0, 50));
    };

    return () => eventSource.close();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto w-full py-8"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 mb-8 font-mono text-sm uppercase font-bold hover:text-red-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Lobby
      </button>

      <div className="border-4 border-[#2b2b2b] p-8 relative bg-[#fcfbf9] shadow-[8px_8px_0_0_rgba(43,43,43,1)]">
        <div className="border-b-4 border-double border-[#2b2b2b] pb-6 mb-8 flex justify-between items-end">
          <div>
            <h2 className="font-serif text-3xl font-bold uppercase tracking-tight">
              Public Records
            </h2>
            <p className="font-mono text-sm uppercase mt-2 tracking-widest text-red-800">
              Live Registry of Questionable Choices
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            Live Updates
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-12 opacity-60">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <span className="font-mono text-sm uppercase">Retrieving dusty files...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12 opacity-60">
            <Gavel className="w-12 h-12 mx-auto mb-4" />
            <p className="font-mono text-sm uppercase">No cases have been judged yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {cases.map((c, idx) => (
                <motion.div 
                  key={c.caseNumber + idx}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-2 border-[#2b2b2b] p-6 bg-white overflow-hidden relative"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                    <div>
                      <span className="font-mono text-xs font-bold bg-[#2b2b2b] text-[#fcfbf9] px-2 py-1 mr-3">
                        {c.caseNumber}
                      </span>
                      <span className="font-serif font-bold text-lg">{c.originalTitle}</span>
                    </div>
                    <span className="font-mono text-xs text-gray-500 whitespace-nowrap">
                      {new Date(c.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 text-sm mb-4">
                    <div>
                      <span className="font-mono text-xs font-bold uppercase tracking-widest block text-red-800 mb-1">Offense</span>
                      <p className="font-sans font-medium text-gray-700">{c.originalAction}</p>
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold uppercase tracking-widest block text-red-800 mb-1">Charges</span>
                      <p className="font-serif font-bold">{c.charges}</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-dashed border-[#2b2b2b] pt-4 mt-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest block text-gray-500 mb-1">Verdict & Sentence</span>
                    <p className="font-sans">
                      <span className="font-bold text-red-800 uppercase mr-2">{c.finalVerdict}:</span> 
                      {c.sentence}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
