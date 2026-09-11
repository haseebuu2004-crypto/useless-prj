import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Gavel, Scale } from "lucide-react";

interface DeliberatingProps {
  onComplete?: () => void;
}

const DELIBERATION_STEPS = [
  "Reviewing submitted Exhibits A–D...",
  "Cross-referencing witness testimony...",
  "Consulting the courtroom observer...",
  "Evaluating defendant's posture & hand gestures...",
  "Questioning the absurd evidence under oath...",
  "The tribunal is taking this suspiciously seriously...",
  "Formulating final sentence & judicial ruling..."
];

export default function Deliberating({ onComplete }: DeliberatingProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % DELIBERATION_STEPS.length);
    }, 1500);

    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => {
        clearInterval(stepInterval);
        clearTimeout(timer);
      };
    }

    return () => clearInterval(stepInterval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6"
    >
      <div className="border-4 border-[#2b2b2b] p-10 bg-[#fcfbf9] max-w-lg w-full shadow-[12px_12px_0_0_rgba(43,43,43,1)]">
        <motion.div
          animate={{ rotate: [0, -18, 12, -12, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
          className="flex justify-center mb-6"
        >
          <Gavel className="w-20 h-20 text-[#2b2b2b]" strokeWidth={1.5} />
        </motion.div>

        <h2 className="font-serif text-2xl md:text-3xl font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
          <Scale className="w-6 h-6 text-red-800" /> The Tribunal Is Deliberating
        </h2>
        
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">
          Official Judicial Reasoning in Progress
        </p>

        <div className="border-2 border-[#2b2b2b] bg-white p-4 font-mono text-sm uppercase text-red-900 font-bold min-h-[50px] flex items-center justify-center shadow-inner">
          <motion.span
            key={stepIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {DELIBERATION_STEPS[stepIndex]}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
