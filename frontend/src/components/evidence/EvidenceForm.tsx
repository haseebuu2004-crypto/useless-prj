import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Plus, ArrowRight, FolderOpen, Loader2, Trash2, ShieldCheck, Tag } from "lucide-react";
import { EvidenceItem, CreateEvidenceInput, EvidenceType, EvidenceSource } from "../../types";
import CourtroomCamera from "../courtroom/CourtroomCamera";

interface EvidenceFormProps {
  evidenceList: EvidenceItem[];
  onAddEvidence: (item: CreateEvidenceInput) => Promise<any>;
  onDeleteEvidence: (evidenceId: string) => Promise<any>;
  onProceedToTestimony: () => void;
  onBack: () => void;
  isLoading?: boolean;
  sessionId?: string | null;
  isSessionClosed?: boolean;
  onObservingChange?: (observing: boolean) => void;
}

export default function EvidenceForm({
  evidenceList,
  onAddEvidence,
  onDeleteEvidence,
  onProceedToTestimony,
  onBack,
  isLoading,
  sessionId = null,
  isSessionClosed = false,
  onObservingChange
}: EvidenceFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<EvidenceType>("TEXT");
  const [source, setSource] = useState<EvidenceSource>("USER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    await onAddEvidence({
      type,
      title: title.trim(),
      description: description.trim(),
      content: content.trim() || undefined,
      source
    });
    setTitle("");
    setDescription("");
    setContent("");
  };

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

      <div className="border-4 border-[#2b2b2b] p-8 md:p-12 relative bg-[#fcfbf9] shadow-[8px_8px_0_0_rgba(43,43,43,1)]">
        <div className="border-b-4 border-double border-[#2b2b2b] pb-6 mb-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold uppercase tracking-tight">
            Phase 2: Evidence Registry
          </h2>
          <p className="font-mono text-sm uppercase mt-2 tracking-widest text-red-800">
            Form 709-C: Official Exhibit Deposition Log
          </p>
        </div>

        {/* Evidence Registration Form */}
        <form onSubmit={handleSubmit} className="mb-10 space-y-6 bg-white border-2 border-[#2b2b2b] p-6 shadow-sm">
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest border-b border-[#2b2b2b] pb-2 flex items-center gap-2">
            <Plus className="w-4 h-4 text-red-800" /> File New Exhibit
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2">
                Exhibit Title (Short Descriptor)
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Suspicious Receipt"
                className="w-full bg-transparent border-2 border-[#2b2b2b] p-3 font-sans text-base focus:outline-none focus:border-red-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2">
                  Evidence Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as EvidenceType)}
                  className="w-full bg-transparent border-2 border-[#2b2b2b] p-3 font-mono text-xs focus:outline-none focus:border-red-800"
                >
                  <option value="TEXT">TEXT</option>
                  <option value="IMAGE">IMAGE</option>
                  <option value="VIDEO">VIDEO</option>
                  <option value="TESTIMONY">TESTIMONY</option>
                  <option value="OBSERVATION">OBSERVATION</option>
                  <option value="GESTURE">GESTURE</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2">
                  Source Origin
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as EvidenceSource)}
                  className="w-full bg-transparent border-2 border-[#2b2b2b] p-3 font-mono text-xs focus:outline-none focus:border-red-800"
                >
                  <option value="USER">USER</option>
                  <option value="SYSTEM">SYSTEM</option>
                  <option value="CAMERA">CAMERA</option>
                  <option value="JUDGE">JUDGE</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2">
              Exhibit Description / Circumstances
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State why this exhibit is relevant to the tribunal..."
              className="w-full bg-transparent border-2 border-[#2b2b2b] p-3 font-sans text-sm focus:outline-none focus:border-red-800 resize-none"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-widest mb-2 opacity-80">
              Verbatim Content / Text Body (Optional)
            </label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Exact quote, raw log snippet, or transcript..."
              className="w-full bg-transparent border border-[#2b2b2b] p-2 font-mono text-xs focus:outline-none focus:border-red-800"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 font-mono font-bold text-xs uppercase tracking-widest text-[#fcfbf9] bg-[#2b2b2b] hover:bg-red-800 transition-colors border-2 border-transparent disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            File Exhibit
          </button>
        </form>

        {/* Exhibit Cards List */}
        <div className="mb-10">
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-red-800" /> Registered Courtroom Exhibits ({evidenceList.length})
          </h3>

          {evidenceList.length === 0 ? (
            <div className="border-2 border-dashed border-[#2b2b2b] p-8 text-center font-mono text-xs text-gray-600 uppercase bg-white/50 space-y-1">
              <span className="font-bold block text-red-800 tracking-widest text-sm">NO EXHIBITS HAVE BEEN ENTERED INTO THE RECORD.</span>
              <span>Register physical exhibits above or activate the Courtroom Observer to log live camera gestures.</span>
            </div>
          ) : (
            <div className="space-y-6">
              {evidenceList.map((ev) => {
                const isCamera = ev.source === "CAMERA" || ev.metadata?.source === "CAMERA";
                return (
                  <div key={ev.id} className={`border-4 border-[#2b2b2b] p-6 shadow-sm relative ${isCamera ? 'bg-amber-50/50' : 'bg-white'}`}>
                    {/* Official Stamp Overlay */}
                    <div className="absolute top-3 right-10 pointer-events-none opacity-80 z-0">
                      <span className="border-2 border-red-800 text-red-800 font-mono text-[10px] font-bold uppercase px-2 py-0.5 tracking-widest rotate-6 inline-block">
                        ENTERED INTO EVIDENCE
                      </span>
                    </div>

                    {/* Card Header */}
                    <div className="flex justify-between items-start border-b-2 border-[#2b2b2b] pb-3 mb-4 relative z-10">
                      <div>
                        <span className="font-mono font-bold text-sm bg-[#2b2b2b] text-[#fcfbf9] px-3 py-1 mr-3 uppercase tracking-wider">
                          {ev.exhibit_number}
                        </span>
                        <h4 className="font-serif font-bold text-xl inline text-[#2b2b2b]">
                          {ev.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => onDeleteEvidence(ev.id)}
                        title="Delete Exhibit"
                        className="text-gray-400 hover:text-red-800 transition-colors p-1 relative z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 font-mono text-xs mb-4">
                      <span className="flex items-center gap-1 bg-red-50 text-red-800 border border-red-800 px-2 py-0.5 font-bold uppercase">
                        <Tag className="w-3 h-3" /> TYPE: {ev.type}
                      </span>
                      
                      {isCamera ? (
                        <span className="flex items-center gap-1 bg-amber-900 text-amber-50 border border-amber-950 px-2 py-0.5 font-bold uppercase tracking-wider">
                          📷 SOURCE: COURTROOM OBSERVER (CONFIDENCE: {Math.round((ev.metadata?.confidence || 0.91) * 100)}%)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-gray-100 text-gray-800 border border-[#2b2b2b] px-2 py-0.5 font-bold uppercase">
                          <ShieldCheck className="w-3 h-3" /> SOURCE: {ev.source}
                        </span>
                      )}
                    </div>

                    {/* Description & Content */}
                    <p className="font-sans text-base mb-3 text-gray-900 font-medium">"{ev.description}"</p>
                    {ev.content && (
                      <div className="bg-gray-50 border-l-2 border-[#2b2b2b] p-3 font-mono text-xs mb-4 text-gray-800">
                        <span className="font-bold block uppercase text-gray-500 mb-1">Verbatim Excerpt:</span>
                        {ev.content}
                      </div>
                    )}

                  {/* Meter Analysis */}
                  <div className="grid sm:grid-cols-2 gap-4 font-mono text-xs border-t border-dashed border-[#2b2b2b] pt-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-bold uppercase">Relevance Rating:</span>
                        <span>{Math.round(ev.relevance * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 border border-[#2b2b2b]">
                        <div className="bg-red-800 h-full" style={{ width: `${Math.round(ev.relevance * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-bold uppercase">Credibility Rating:</span>
                        <span>{Math.round(ev.credibility * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 border border-[#2b2b2b]">
                        <div className="bg-[#2b2b2b] h-full" style={{ width: `${Math.round(ev.credibility * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-6 border-t-2 border-[#2b2b2b] border-dashed">
          <button
            onClick={onProceedToTestimony}
            disabled={isLoading}
            className="flex items-center gap-3 px-8 py-4 font-mono font-bold uppercase tracking-widest text-[#fcfbf9] bg-red-800 hover:bg-[#2b2b2b] transition-colors border-2 border-transparent focus:outline-none disabled:opacity-50"
          >
            Proceed to Testimony <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
