import crypto from "crypto";
import { EvidenceItem, CreateEvidenceInput, EvidenceType, EvidenceSource } from "./evidenceTypes.js";

const VALID_TYPES: EvidenceType[] = ["TEXT", "IMAGE", "VIDEO", "TESTIMONY", "OBSERVATION", "GESTURE"];
const VALID_SOURCES: EvidenceSource[] = ["USER", "SYSTEM", "CAMERA", "JUDGE"];

export function getExhibitLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return `EXHIBIT ${letter}`;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function validateEvidenceInput(input: CreateEvidenceInput): void {
  if (!input.type || !VALID_TYPES.includes(input.type)) {
    throw new Error(`Invalid or missing evidence type. Allowed types: ${VALID_TYPES.join(", ")}`);
  }
  if (!input.title || typeof input.title !== "string" || !input.title.trim()) {
    throw new Error("Evidence title is required and cannot be empty.");
  }
  if (!input.description || typeof input.description !== "string" || !input.description.trim()) {
    throw new Error("Evidence description is required and cannot be empty.");
  }
  if (input.source && !VALID_SOURCES.includes(input.source)) {
    throw new Error(`Invalid evidence source. Allowed sources: ${VALID_SOURCES.join(", ")}`);
  }
}

export function createEvidenceItem(input: CreateEvidenceInput, exhibitIndex: number): EvidenceItem {
  validateEvidenceInput(input);

  const id = "EVD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  const exhibit_number = getExhibitLetter(exhibitIndex);
  const source: EvidenceSource = input.source || "USER";

  const seed = hashString(`${input.title}:${input.description}:${input.type}:${source}`);
  const relevance = Number((0.50 + ((seed % 45) / 100)).toFixed(2)); // 0.50 - 0.94
  const credibility = Number((0.40 + (((seed * 7) % 55) / 100)).toFixed(2)); // 0.40 - 0.94

  return {
    id,
    exhibit_number,
    type: input.type,
    title: input.title.trim(),
    description: input.description.trim(),
    content: input.content?.trim(),
    source,
    relevance,
    credibility,
    created_at: new Date().toISOString(),
    metadata: input.metadata || {},
  };
}
