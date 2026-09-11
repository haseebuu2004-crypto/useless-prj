# Human Tribunal — Competition-Day Operational Checklist

Follow this checklist before and during live competition presentations.

---

## 1. BEFORE THE EVENT (Setup & Pre-Flight)

- [ ] **Laptop Power**: Ensure laptop is fully charged and plugged into power.
- [ ] **Dependencies Installed**: Verify `node_modules` exist in both `backend/` and `frontend/`.
- [ ] **Backend Service Check**:
  ```bash
  cd backend
  npm run dev
  ```
  Verify terminal displays: `Human Tribunal Backend running on http://localhost:3000`
- [ ] **Frontend Service Check**:
  ```bash
  cd frontend
  npm run dev
  ```
  Verify terminal displays: `Local: http://localhost:5173/`
- [ ] **Backend Health Check**: Open `http://localhost:3000/api/health` in browser and confirm `{"status":"ok"}` response.
- [ ] **Browser Camera Permissions**: Open browser, navigate to `http://localhost:5173/`, and verify camera permissions are granted.
- [ ] **Demo URL Ready**: Bookmark or open tab to `http://localhost:5173/?demo=true`.
- [ ] **Ollama Check (Optional)**: If presenting with local LLM, run `ollama serve` and verify `http://localhost:11434/api/version`.
- [ ] **Mock Fallback Verification**: Set `JUDGE_PROVIDER="mock"` in environment or verify automatic fallback when Ollama is stopped.
- [ ] **Internet-Independent Verification**: Disconnect Wi-Fi and verify full application functions offline locally.

---

## 2. DURING THE LIVE DEMO (Presentation Routine)

- [ ] **Launch Services**: Ensure backend (port 3000) and frontend (port 5173) are running.
- [ ] **Open Demo View**: Navigate to `http://localhost:5173/?demo=true`.
- [ ] **Step 1 — Start Demo**: Click **START DEMO** (loads *"THE MIDNIGHT CAKE INCIDENT"* & Exhibit A).
- [ ] **Step 2 — Vision Observation**: Click **SIMULATE GESTURE (RIGHT HAND)** (or raise physical hand in front of webcam).
- [ ] **Step 3 — Call Witness**: Click **CALL WITNESS** (submits roommate deposition).
- [ ] **Step 4 — Deliberate**: Click **BEGIN DELIBERATION** (triggers verdict & suspicion score).
- [ ] **Step 5 — Announce Sentence**: Read official charges, suspicion score, and harmless sentence aloud.
- [ ] **Step 6 — Reset**: Click **RESET CASE** to leave system fresh for follow-up questions.

---

## 3. EMERGENCY FALLBACK MATRIX

| Problem | Symptom | Immediate Solution |
| :--- | :--- | :--- |
| **Webcam Hardware Fails** | Camera feed black or permission prompt blocked | Click **SIMULATE GESTURE (RIGHT HAND)** on the Demo Panel. |
| **Ollama Crashes / Hangs** | Deliberation takes > 2 seconds | Backend automatically falls back to `MockJudgeProvider`. Zero manual intervention needed. |
| **LLM Returns Invalid JSON** | LLM outputs plain text | Validation pipeline catches invalid format and auto-selects `MockJudgeProvider`. |
| **Backend Unreachable** | UI shows red server error banner | Restart backend (`cd backend; npm run dev`) and refresh page. |
| **Network Disconnected** | No Wi-Fi access | System runs 100% offline on localhost. Continue demo normally. |
