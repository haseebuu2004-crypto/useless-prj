/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import AutoTribunalManager from "./components/courtroom/AutoTribunalManager";
import Home from "./components/courtroom/Home";
import SubmitForm from "./components/evidence/SubmitForm";
import EvidenceForm from "./components/evidence/EvidenceForm";
import TestimonyForm from "./components/courtroom/TestimonyForm";
import Deliberating from "./components/judge/Deliberating";
import VerdictDisplay from "./components/verdict/VerdictDisplay";
import SessionClosed from "./components/courtroom/SessionClosed";
import RecentCases from "./components/courtroom/RecentCases";
import TribunalProgress from "./components/courtroom/TribunalProgress";
import DemoBanner from "./components/demo/DemoBanner";
import DemoControlPanel from "./components/demo/DemoControlPanel";
import CourtroomCamera from "./components/courtroom/CourtroomCamera";
import { useTribunalSession } from "./hooks/useTribunalSession";
import { useDemoMode } from "./hooks/useDemoMode";
import { DEMO_TESTIMONY } from "./demo/demoCasePreset";
import { getJudgeStatus } from "./api/sessionApi";

export default function App() {
  const isDemoMode = useDemoMode();

  const {
    session,
    status,
    loading,
    error,
    absurdityMode,
    toggleAbsurdityMode,
    startSession,
    startDemoSession,
    submitCase,
    addEvidence,
    deleteEvidence,
    submitTestimony,
    startDeliberation,
    fetchVerdict,
    closeSession,
    resetSession,
  } = useTribunalSession();

  const [overlayView, setOverlayView] = useState<"recent-cases" | null>(null);
  const [isObserving, setIsObserving] = useState(false);
  const [judgeProvider, setJudgeProvider] = useState<"mock" | "local-llm" | "gemini">("mock");

  // Fetch real judge provider status on mount
  useEffect(() => {
    getJudgeStatus()
      .then((s) => setJudgeProvider(s.provider as any))
      .catch(() => {});
  }, []);

  // Render normal V2 automatic AI courtroom at '/'
  if (!isDemoMode) {
    return (
      <div className="min-h-screen paper-texture px-4 py-6 md:p-10 overflow-x-hidden">
        <AutoTribunalManager />
      </div>
    );
  }

  // --- Demo Mode handlers ---
  const handleStartTribunal = async () => {
    setOverlayView(null);
    await startSession();
  };

  const handleStartDemo = useCallback(async () => {
    setOverlayView(null);
    await startDemoSession();
  }, [startDemoSession]);

  const handleSimulateCameraObservation = useCallback(async () => {
    if (!session?.session_id) return;
    await addEvidence({
      type: "GESTURE",
      title: "Raised Right Hand",
      description: "SIMULATED: Courtroom Observer detected the defendant raising their right hand in a defensive gesture.",
      source: "CAMERA",
      metadata: {
        detector: "gestureDetector",
        event: "RIGHT_HAND_RAISED",
        confidence: 0.91,
        isMock: true,
        source: "CAMERA",
        note: "Simulated courtroom observation (demo mode — not from real webcam)"
      }
    });
  }, [session, addEvidence]);

  const handleCallWitness = useCallback(async () => {
    if (!session?.session_id) return;
    await submitTestimony(DEMO_TESTIMONY);
  }, [session, submitTestimony]);

  const handleBeginDeliberation = useCallback(async () => {
    if (!session?.session_id) return;
    await startDeliberation();
  }, [session, startDeliberation]);

  const handleResetDemo = useCallback(async () => {
    if (session?.session_id) {
      try { await closeSession(); } catch {}
    }
    resetSession();
    setIsObserving(false);
  }, [session, closeSession, resetSession]);

  return (
    <div className="min-h-screen paper-texture px-4 py-6 md:p-10 overflow-x-hidden">
      {/* Demo Mode Banner */}
      <DemoBanner />

      {overlayView !== "recent-cases" && (
        <TribunalProgress
          status={status}
          absurdityMode={absurdityMode}
          onToggleAbsurdity={toggleAbsurdityMode}
        />
      )}

      {/* Demo Mode Control Panel */}
      {overlayView !== "recent-cases" && (
        <DemoControlPanel
          status={status}
          judgeProvider={judgeProvider as any}
          isObserving={isObserving}
          isLoading={loading}
          onStartDemo={handleStartDemo}
          onSimulateCameraObservation={handleSimulateCameraObservation}
          onCallWitness={handleCallWitness}
          onBeginDeliberation={handleBeginDeliberation}
          onResetDemo={handleResetDemo}
        />
      )}

      <AnimatePresence mode="wait">
        {overlayView === "recent-cases" ? (
          <div key="recent-cases">
            <RecentCases onBack={() => setOverlayView(null)} />
          </div>
        ) : (
          <>
            {/* Persistent Courtroom Observer Camera Panel during Active Tribunal Session */}
            {status !== "LOBBY" && status !== "CLOSED" && session && (
              <div key="active-camera-panel" className="max-w-4xl mx-auto w-full mb-6">
                <CourtroomCamera
                  sessionId={session.session_id}
                  isSessionClosed={session.status === "CLOSED"}
                  onObservingChange={setIsObserving}
                  showMockControls={true}
                />
              </div>
            )}

            {status === "LOBBY" && (
              <div key="home">
                <Home
                  onFileCase={handleStartTribunal}
                  onViewRecentCases={() => setOverlayView("recent-cases")}
                  sessionId={session?.session_id}
                  isLoadingSession={loading}
                  sessionError={error}
                  isDemoMode={isDemoMode}
                />
              </div>
            )}

            {status === "CASE_FILED" && (
              <div key="submit">
                <SubmitForm
                  onBack={resetSession}
                  onSubmit={async (caseData) => {
                    await submitCase(caseData);
                  }}
                />
              </div>
            )}

            {status === "EVIDENCE" && session && (
              <div key="evidence">
                <EvidenceForm
                  evidenceList={session.evidence}
                  onAddEvidence={async (item) => {
                    await addEvidence(item);
                  }}
                  onDeleteEvidence={async (evidenceId) => {
                    await deleteEvidence(evidenceId);
                  }}
                  onProceedToTestimony={async () => {
                    await submitTestimony({ witness: "Defendant", statement: "I stand by my absurdity." });
                  }}
                  onBack={resetSession}
                  isLoading={loading}
                  sessionId={session.session_id}
                  isSessionClosed={session.status === "CLOSED"}
                  onObservingChange={setIsObserving}
                />
              </div>
            )}

            {status === "TESTIMONY" && session && (
              <div key="testimony">
                <TestimonyForm
                  testimonyList={session.testimony}
                  onAddTestimony={async (item) => {
                    await submitTestimony(item);
                  }}
                  onProceedToDeliberation={async () => {
                    await startDeliberation();
                  }}
                  onBack={resetSession}
                  isLoading={loading}
                />
              </div>
            )}

            {status === "DELIBERATION" && (
              <div key="deliberating">
                <Deliberating
                  onComplete={async () => {
                    await fetchVerdict();
                  }}
                />
              </div>
            )}

            {status === "VERDICT" && session?.verdict && (
              <div key="verdict">
                <VerdictDisplay
                  verdict={{
                    caseNumber: session.verdict.caseNumber,
                    charges: session.verdict.charges,
                    reasoning: session.verdict.reasoning || (session.verdict as any).reason,
                    finalVerdict: session.verdict.decision || (session.verdict as any).finalVerdict,
                    sentence: session.verdict.sentence,
                    decision: session.verdict.decision,
                    confidence: session.verdict.confidence,
                    provider: session.verdict.provider,
                    model: session.verdict.model,
                    fallback_reason: session.verdict.fallback_reason,
                    evidence_assessment: session.verdict.evidence_assessment,
                    testimony_assessment: session.verdict.testimony_assessment,
                    absurdity_context: session.verdict.absurdity_context,
                  }}
                  onBack={async () => {
                    await closeSession();
                  }}
                  onCloseSession={async () => {
                    await closeSession();
                  }}
                />
              </div>
            )}

            {status === "CLOSED" && session && (
              <div key="closed">
                <SessionClosed
                  session={session}
                  onReturnToLobby={resetSession}
                />
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

