export type EvidenceType = "TEXT" | "IMAGE" | "VIDEO" | "TESTIMONY" | "OBSERVATION" | "GESTURE";
export type EvidenceSource = "USER" | "SYSTEM" | "CAMERA" | "JUDGE";

export interface EvidenceItem {
  id: string;
  exhibit_number: string;
  type: EvidenceType;
  title: string;
  description: string;
  content?: string;
  source: EvidenceSource;
  relevance: number;
  credibility: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface CreateEvidenceInput {
  type: EvidenceType;
  title: string;
  description: string;
  content?: string;
  source?: EvidenceSource;
  metadata?: Record<string, any>;
}
