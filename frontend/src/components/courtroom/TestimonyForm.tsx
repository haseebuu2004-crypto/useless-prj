import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, UserCheck, Gavel, Loader2, MessageSquare } from "lucide-react";
import { TestimonyItem } from "../../types";

interface TestimonyFormProps {
  testimonyList: TestimonyItem[];
  onAddTestimony: (item: { witness: string; statement: string }) => Promise<any>;
  onProceedToDeliberation: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function TestimonyForm({
  testimonyList,
  onAddTestimony,
  onProceedToDeliberation,
  onBack,
  isLoading
}: TestimonyFormProps) {
  const [witness, setWitness] = useState("");
  const [statement, setStatement] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!witness.trim() || !statement.trim()) return;
    await onAddTestimony({ witness, statement });
    setWitness("");
    setStatement("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-3xl mx-auto w-full py-8"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 mb-8 font-mono text-sm uppercase font-bold hover:text-red-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Lobby
      </button>

      <div className="border-4 border-[#2b2b2b] p-8 md:p-12 relative bg-[#fcfbf9] shadow-[8px_8px_0_0_rgba(43,43,43,1)]">
        <div className="border-b-4 border-double border-[#2b2b2b] pb-6 mb-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold uppercase tracking-tight">
            Phase 3: Witness Testimony
          </h2>
          <p className="font-mono text-sm uppercase mt-2 tracking-widest text-red-800">
            Form 709-D: Sworn Statements & Depositions
          </p>
        </div>

        {/* Testimony Submission Form */}
        <form onSubmit={handleSubmit} className="mb-10 space-y-6 bg-white border-2 border-[#2b2b2b] p-6">
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest border-b border-[#2b2b2b] pb-2">
            Record Witness Deposition
          </h3>

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2">
              Witness Name / Role
            </label>
            <input
              type="text"
              required
              value={witness}
              onChange={(e) => setWitness(e.target.value)}
              placeholder="e.g. Neighbor, Roommate, The Cat, Self"
              className="w-full bg-transparent border-2 border-[#2b2b2b] p-3 font-sans text-base focus:outline-none focus:border-red-800"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2">
              Witness Statement
            </label>
            <textarea
              rows={3}
              required
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="e.g. I saw them eat the entire pizza in 4 minutes without offering anyone a slice."
              className="w-full bg-transparent border-2 border-[#2b2b2b] p-3 font-sans text-base focus:outline-none focus:border-red-800 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 font-mono font-bold text-xs uppercase tracking-widest text-[#fcfbf9] bg-[#2b2b2b] hover:bg-red-800 transition-colors border-2 border-transparent disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Record Deposition
          </button>
        </form>

        {/* Depositions List */}
        <div className="mb-10">
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-800" /> Sworn Depositions Entered into Record ({testimonyList.length})
          </h3>

          {testimonyList.length === 0 ? (
            <div className="border-2 border-dashed border-[#2b2b2b] p-8 text-center font-mono text-xs text-gray-600 uppercase bg-white/50 space-y-1">
              <span className="font-bold block text-red-800 tracking-widest text-sm">THE WITNESS HAS NOT YET TAKEN THE STAND.</span>
              <span>Record sworn statements under oath above or proceed directly to tribunal deliberation.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {testimonyList.map((t) => (
                <div key={t.id} className="border-2 border-[#2b2b2b] p-5 bg-white relative shadow-sm">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                    <span className="font-mono text-xs font-bold uppercase text-red-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> WITNESS: {t.witness}
                    </span>
                    <span className="font-mono text-[10px] bg-[#2b2b2b] text-white px-2 py-0.5 uppercase tracking-wider font-bold">
                      ENTERED INTO RECORD
                    </span>
                  </div>
                  <p className="font-sans text-base text-gray-900 font-medium">"{t.statement}"</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-6 border-t-2 border-[#2b2b2b] border-dashed">
          <button
            onClick={onProceedToDeliberation}
            disabled={isLoading}
            className="flex items-center gap-3 px-8 py-4 font-mono font-bold uppercase tracking-widest text-[#fcfbf9] bg-red-800 hover:bg-[#2b2b2b] transition-colors border-2 border-transparent focus:outline-none disabled:opacity-50"
          >
            Begin Deliberation <Gavel className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
