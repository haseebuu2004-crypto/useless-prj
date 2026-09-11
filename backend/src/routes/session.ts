import { Router } from "express";
import {
  createSession,
  getSessionById,
  submitCaseData,
  addEvidenceToSession,
  getEvidenceListForSession,
  getEvidenceItemForSession,
  deleteEvidenceFromSession,
  addTestimonyItem,
  startDeliberating,
  generateSessionVerdict,
  closeTribunalSession
} from "../services/sessionService.js";

const router = Router();

function getErrorStatusCode(err: any): number {
  const msg = err?.message || "";
  if (msg.includes("Session not found") || msg.includes("not found in session")) {
    return 404;
  }
  if (msg.includes("Invalid transition") || msg.includes("CLOSED tribunal session") || msg.includes("Deliberation verdict missing")) {
    return 409;
  }
  if (msg.includes("required") || msg.includes("Invalid") || msg.includes("cannot be empty")) {
    return 400;
  }
  return 400;
}

// 1. POST /api/session/start
router.post("/session/start", (req, res) => {
  const session = createSession();
  res.status(201).json(session);
});

// 2. GET /api/session/:id
router.get("/session/:id", (req, res) => {
  const { id } = req.params;
  const session = getSessionById(id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
});

// 3. POST /api/session/:id/case
router.post("/session/:id/case", (req, res) => {
  const { id } = req.params;
  const { title, action, reason, defense_prompt, manglish_reaction } = req.body || {};
  if (!title || !action || !reason || typeof title !== "string" || typeof action !== "string" || typeof reason !== "string") {
    res.status(400).json({ error: "Missing title, action, or reason in case submission." });
    return;
  }
  try {
    const updated = submitCaseData(id, {
      title: title.trim(),
      action: action.trim(),
      reason: reason.trim(),
      defense_prompt: typeof defense_prompt === "string" ? defense_prompt.trim() : undefined,
      manglish_reaction: typeof manglish_reaction === "string" ? manglish_reaction.trim() : undefined
    });
    res.json(updated);
  } catch (err: any) {
    const status = getErrorStatusCode(err);
    res.status(status).json({ error: err.message });
  }
});

// 4. POST /api/session/:id/evidence (Create exhibit)
router.post("/session/:id/evidence", (req, res) => {
  const { id } = req.params;
  const { type, title, description, content, source, metadata } = req.body || {};
  
  // Backward compatibility: fallback title to type or description snippet if missing
  const finalType = type || "TEXT";
  const finalTitle = title || description || "Untitled Exhibit";
  const finalDescription = description || title || "No description provided.";

  try {
    const result = addEvidenceToSession(id, {
      type: finalType,
      title: finalTitle,
      description: finalDescription,
      content,
      source,
      metadata
    });
    res.status(201).json(result.evidence);
  } catch (err: any) {
    const status = getErrorStatusCode(err);
    res.status(status).json({ error: err.message });
  }
});

// 5. GET /api/session/:id/evidence (List exhibits)
router.get("/session/:id/evidence", (req, res) => {
  const { id } = req.params;
  try {
    const list = getEvidenceListForSession(id);
    res.json(list);
  } catch (err: any) {
    const status = getErrorStatusCode(err);
    res.status(status).json({ error: err.message });
  }
});

// 6. GET /api/session/:id/evidence/:evidenceId (Get single exhibit)
router.get("/session/:id/evidence/:evidenceId", (req, res) => {
  const { id, evidenceId } = req.params;
  try {
    const item = getEvidenceItemForSession(id, evidenceId);
    res.json(item);
  } catch (err: any) {
    const status = getErrorStatusCode(err);
    res.status(status).json({ error: err.message });
  }
});

// 7. DELETE /api/session/:id/evidence/:evidenceId (Delete exhibit)
router.delete("/session/:id/evidence/:evidenceId", (req, res) => {
  const { id, evidenceId } = req.params;
  try {
    const result = deleteEvidenceFromSession(id, evidenceId);
    res.json({ success: true, deletedId: result.deletedId });
  } catch (err: any) {
    const status = getErrorStatusCode(err);
    res.status(status).json({ error: err.message });
  }
});

// 8. POST /api/session/:id/testimony
router.post("/session/:id/testimony", (req, res) => {
  const { id } = req.params;
  const { witness, statement } = req.body || {};
  if (!witness || !statement || typeof witness !== "string" || typeof statement !== "string") {
    res.status(400).json({ error: "Witness and statement are required strings." });
    return;
  }
  try {
    const updated = addTestimonyItem(id, { witness: witness.trim(), statement: statement.trim() });
    res.json(updated);
  } catch (err: any) {
    const status = getErrorStatusCode(err);
    res.status(status).json({ error: err.message });
  }
});

// 9. POST /api/session/:id/deliberate
router.post("/session/:id/deliberate", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await startDeliberating(id);
    res.json(updated);
  } catch (err: any) {
    const status = getErrorStatusCode(err);
    res.status(status).json({ error: err.message });
  }
});

// 10. POST /api/session/:id/verdict
router.post("/session/:id/verdict", (req, res) => {
  const { id } = req.params;
  try {
    const updated = generateSessionVerdict(id);
    res.json(updated);
  } catch (err: any) {
    const status = getErrorStatusCode(err);
    res.status(status).json({ error: err.message });
  }
});

// 11. POST /api/session/:id/close
router.post("/session/:id/close", (req, res) => {
  const { id } = req.params;
  try {
    const updated = closeTribunalSession(id);
    res.json(updated);
  } catch (err: any) {
    const status = getErrorStatusCode(err);
    res.status(status).json({ error: err.message });
  }
});

import { judgeService } from "../services/judge/judgeService.js";
import { geminiNarrator } from "../services/narrative/geminiNarrator.js";

// 12. GET /api/judge/status
router.get("/judge/status", async (req, res) => {
  try {
    const status = await judgeService.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. POST /api/judge/toggle-absurdity
router.post("/judge/toggle-absurdity", (req, res) => {
  const { enabled } = req.body;
  const targetState = enabled !== undefined ? Boolean(enabled) : !judgeService.isAbsurdityModeEnabled();
  judgeService.setAbsurdityMode(targetState);
  res.json({ success: true, absurdity_mode: targetState });
});

// 14. POST /api/session/:id/narrate — Generate fresh AI courtroom narrative via Gemini
router.post("/session/:id/narrate", async (req, res) => {
  const { id } = req.params;
  const { observations, duration_seconds } = req.body || {};
  try {
    const narrative = await geminiNarrator.generateNarrative({
      observation_duration_seconds: duration_seconds || 7,
      observations: Array.isArray(observations) ? observations : []
    });

    const updated = submitCaseData(id, {
      title: narrative.title,
      action: narrative.action,
      reason: narrative.reason,
      defense_prompt: narrative.defense_prompt,
      manglish_reaction: narrative.manglish_reaction
    });

    res.json({
      session: updated,
      narrative
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 15. POST /api/session/demo/start — Competition Demo Mode one-shot bootstrap
router.post("/session/demo/start", (req, res) => {
  try {
    // Step 1: Create session
    const session = createSession();
    session.isDemo = true;
    const sessionId = session.session_id;

    // Step 2: File the canonical demo case
    submitCaseData(sessionId, {
      title: "THE MIDNIGHT CAKE INCIDENT",
      action: "The defendant consumed the final slice of cake at approximately 3:00 AM.",
      reason: "Hunger."
    });

    // Step 3: Add Exhibit A — Empty Cake Container
    addEvidenceToSession(sessionId, {
      type: "TEXT",
      title: "Empty Cake Container",
      description: "A glass container found in the kitchen sink at 6:00 AM. Residual frosting present. Container was marked with initials.",
      content: "Container contents: ZERO. Missing: One (1) slice of birthday cake.",
      source: "USER"
    });

    const finalSession = getSessionById(sessionId)!;
    res.status(201).json(finalSession);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
