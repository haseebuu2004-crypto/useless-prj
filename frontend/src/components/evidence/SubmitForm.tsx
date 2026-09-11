import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Stamp } from "lucide-react";
import { CaseSubmission } from "../../types";

interface SubmitFormProps {
  onBack: () => void;
  onSubmit: (submission: CaseSubmission) => void;
}

export default function SubmitForm({ onBack, onSubmit }: SubmitFormProps) {
  const [title, setTitle] = useState("");
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !action || !reason) return;
    onSubmit({ title, action, reason });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto w-full py-8"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 mb-8 font-mono text-sm uppercase font-bold hover:text-red-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Lobby
      </button>

      <form 
        onSubmit={handleSubmit}
        className="border-2 border-[#2b2b2b] p-8 md:p-12 relative bg-[#fcfbf9] shadow-[8px_8px_0_0_rgba(43,43,43,1)]"
      >
        <div className="border-b-4 border-double border-[#2b2b2b] pb-6 mb-8 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-widest bg-[#2b2b2b] text-white px-3 py-1 inline-block mb-3">
            FILED UNDER OATH — DOCKET FORM 709-B
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold uppercase tracking-tight">
            Formal Indictment & Filing
          </h2>
          <p className="font-mono text-xs uppercase mt-2 tracking-widest text-red-800 font-bold">
            "State the offense with clarity. The court values specificity over modesty."
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2 text-[#2b2b2b]">
              Case Title / Docket Summary
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Case of the Midnight Microwave Salmon"
              className="w-full bg-transparent border-b-2 border-[#2b2b2b] border-dashed py-2 font-sans text-xl focus:outline-none focus:border-solid focus:border-red-800 placeholder:text-gray-400 placeholder:font-mono placeholder:text-xs"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2 text-[#2b2b2b]">
              Alleged Action (The Charge & Facts)
            </label>
            <textarea
              required
              rows={3}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="State the facts clearly. e.g. Defendant deployed untested code directly to main on a Friday at 4:58 PM."
              className="w-full bg-transparent border-2 border-[#2b2b2b] p-4 font-sans text-base focus:outline-none focus:border-red-800 resize-none"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2 text-[#2b2b2b]">
              Motive & Context (Why The Court Must Intervene)
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the tribunal should care. e.g. Broke staging build, skipped 12 failing unit tests, left for weekend."
              className="w-full bg-transparent border-2 border-[#2b2b2b] p-4 font-sans text-base focus:outline-none focus:border-red-800 resize-none"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2 opacity-60">
              Initial Exhibit Attachment
            </label>
            <div className="border-2 border-dashed border-[#2b2b2b] p-4 text-center cursor-not-allowed opacity-70 bg-gray-100/50">
              <span className="font-mono text-xs uppercase font-bold text-gray-600">
                Physical exhibits will be submitted in Phase 3 (Exhibits & Courtroom Observer).
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-3 px-8 py-4 font-mono font-bold text-xs uppercase tracking-widest text-[#fcfbf9] bg-red-800 hover:bg-[#2b2b2b] transition-colors border-2 border-transparent focus:outline-none shadow-md"
          >
            File Indictment & Enter Docket <Stamp className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
