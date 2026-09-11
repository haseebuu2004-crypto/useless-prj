import { useState, useCallback, useEffect } from "react";
import { TribunalSession, CaseSubmission, CreateEvidenceInput } from "../types";
import * as api from "../api/sessionApi";

export function useTribunalSession() {
  const [session, setSession] = useState<TribunalSession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [absurdityMode, setAbsurdityMode] = useState<boolean>(true);

  useEffect(() => {
    api.getJudgeStatus()
      .then((res) => {
        if (res.absurdity_mode !== undefined) {
          setAbsurdityMode(res.absurdity_mode);
        }
      })
      .catch(() => {});
  }, []);

  const toggleAbsurdityMode = useCallback(async () => {
    try {
      const nextState = !absurdityMode;
      const res = await api.toggleAbsurdityMode(nextState);
      setAbsurdityMode(res.absurdity_mode);
    } catch (err: any) {
      setError(err.message || "Failed to toggle absurdity mode.");
    }
  }, [absurdityMode]);

  /** Standard session start (normal flow) */
  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newSession = await api.startSession();
      setSession(newSession);
      return newSession;
    } catch (err: any) {
      setError(err.message || "Failed to start session.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Demo session start — single round-trip that creates the session,
   * files THE MIDNIGHT CAKE INCIDENT, and adds Exhibit A in one request.
   */
  const startDemoSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newSession = await api.startDemoSession();
      setSession(newSession);
      return newSession;
    } catch (err: any) {
      setError(err.message || "Failed to start demo session.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitCase = useCallback(async (caseData: CaseSubmission) => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.submitCase(session.session_id, caseData);
      setSession(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to submit case.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const addEvidence = useCallback(async (evidenceData: CreateEvidenceInput) => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      await api.addEvidence(session.session_id, evidenceData);
      const updatedSession = await api.getSession(session.session_id);
      setSession(updatedSession);
      return updatedSession;
    } catch (err: any) {
      setError(err.message || "Failed to add evidence.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const deleteEvidence = useCallback(async (evidenceId: string) => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      await api.deleteEvidence(session.session_id, evidenceId);
      const updatedSession = await api.getSession(session.session_id);
      setSession(updatedSession);
      return updatedSession;
    } catch (err: any) {
      setError(err.message || "Failed to delete evidence.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const submitTestimony = useCallback(async (testimonyData: { witness: string; statement: string }) => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.submitTestimony(session.session_id, testimonyData);
      setSession(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to submit testimony.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const startDeliberation = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.startDeliberation(session.session_id);
      setSession(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to start deliberation.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const fetchVerdict = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.generateVerdict(session.session_id);
      setSession(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to generate verdict.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const closeSession = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await api.closeSession(session.session_id);
      setSession(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to close session.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const resetSession = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  return {
    session,
    status: session?.status || "LOBBY",
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
  };
}
