import { TribunalSession, CaseSubmission, EvidenceItem, CreateEvidenceInput, JudgeStatusResponse } from "../types/index.js";

const BASE_URL = ((import.meta as any).env?.VITE_API_URL) || 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export function startSession(): Promise<TribunalSession> {
  return request<TribunalSession>('/api/session/start', { method: 'POST' });
}

export function getSession(sessionId: string): Promise<TribunalSession> {
  return request<TribunalSession>(`/api/session/${sessionId}`);
}

export function submitCase(sessionId: string, caseData: CaseSubmission): Promise<TribunalSession> {
  return request<TribunalSession>(`/api/session/${sessionId}/case`, {
    method: 'POST',
    body: JSON.stringify(caseData),
  });
}

export function addEvidence(sessionId: string, evidenceData: CreateEvidenceInput): Promise<EvidenceItem> {
  return request<EvidenceItem>(`/api/session/${sessionId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(evidenceData),
  });
}

export function getEvidenceList(sessionId: string): Promise<EvidenceItem[]> {
  return request<EvidenceItem[]>(`/api/session/${sessionId}/evidence`);
}

export function getEvidenceItem(sessionId: string, evidenceId: string): Promise<EvidenceItem> {
  return request<EvidenceItem>(`/api/session/${sessionId}/evidence/${evidenceId}`);
}

export function deleteEvidence(sessionId: string, evidenceId: string): Promise<{ success: boolean; deletedId: string }> {
  return request<{ success: boolean; deletedId: string }>(`/api/session/${sessionId}/evidence/${evidenceId}`, {
    method: 'DELETE',
  });
}

export function submitTestimony(sessionId: string, testimonyData: { witness: string; statement: string }): Promise<TribunalSession> {
  return request<TribunalSession>(`/api/session/${sessionId}/testimony`, {
    method: 'POST',
    body: JSON.stringify(testimonyData),
  });
}

export function startDeliberation(sessionId: string): Promise<TribunalSession> {
  return request<TribunalSession>(`/api/session/${sessionId}/deliberate`, { method: 'POST' });
}

export function generateVerdict(sessionId: string): Promise<TribunalSession> {
  return request<TribunalSession>(`/api/session/${sessionId}/verdict`, { method: 'POST' });
}

export function closeSession(sessionId: string): Promise<TribunalSession> {
  return request<TribunalSession>(`/api/session/${sessionId}/close`, { method: 'POST' });
}

export function getJudgeStatus(): Promise<JudgeStatusResponse> {
  return request<JudgeStatusResponse>('/api/judge/status');
}

export function toggleAbsurdityMode(enabled?: boolean): Promise<{ success: boolean; absurdity_mode: boolean }> {
  return request<{ success: boolean; absurdity_mode: boolean }>('/api/judge/toggle-absurdity', {
    method: 'POST',
    body: JSON.stringify({ enabled })
  });
}

export function startDemoSession(): Promise<TribunalSession> {
  return request<TribunalSession>('/api/session/demo/start', { method: 'POST' });
}

export function generateNarrative(sessionId: string, observations: any[], durationSeconds: number = 7): Promise<{ session: TribunalSession; narrative: any }> {
  return request<{ session: TribunalSession; narrative: any }>(`/api/session/${sessionId}/narrate`, {
    method: 'POST',
    body: JSON.stringify({ observations, duration_seconds: durationSeconds }),
  });
}

export function checkHealth(): Promise<{ status: string; timestamp: string }> {
  return request<{ status: string; timestamp: string }>('/api/health');
}


