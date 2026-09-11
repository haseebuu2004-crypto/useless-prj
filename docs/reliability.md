# Human Tribunal — Production & Reliability Guide

## 1. System Architecture & Resilience Overview

Human Tribunal is engineered as a lightweight, zero-paid-API application designed for live competition demos and production hosting. All client-side computer vision models execute in-browser via WebAssembly, and local AI reasoning degrades gracefully through multi-tiered fallback providers.

---

## 2. Architecture Risks & Failure Modes

| Risk / Failure Mode | Impact | Mitigating Controls & Fallbacks |
| :--- | :--- | :--- |
| **Ollama LLM Offline / Unreachable** | Deliberation call fails or hangs | Automatic 2-second health check & 30-second timeout; instant fallback to built-in `MockJudgeProvider`. |
| **Ollama Output Invalid JSON** | LLM parsing fails | Controlled 1-retry repair attempt with formatting instructions; if still invalid, falls back to `MockJudgeProvider`. |
| **Webcam Permission Denied / Unavailable** | Camera feed inactive | System logs "Courtroom Observer Blind" notice; tribunal continues cleanly using user-submitted exhibits and mock camera simulations. |
| **MediaPipe WASM Loading Failure** | Vision detector initialization error | Caught in browser context; falls back to manual evidence submission without breaking UI. |
| **Excessively Large Payloads** | Server memory pressure or crash | Express strict `100kb` body size limit; payloads > 100kb rejected with `413 Payload Too Large`. |
| **Uncaught Exception in Backend** | Potential stack trace leak | Global error handling middleware intercepts uncaught errors and returns clean JSON without leaking stack traces or internal paths. |
| **Closed Session Modification** | State corruption | Strict state machine validations reject exhibits or depositions on `CLOSED` sessions with HTTP `409 Conflict`. |

---

## 3. Fallback Hierarchy

```
[ Case Deliberation Triggered ]
               │
               ▼
   Is JUDGE_PROVIDER == 'local'?
          ├── YES ──► Check Ollama /api/version (2s timeout)
          │                 │
          │             Is Online?
          │                ├── YES ──► Call Ollama /api/generate (30s timeout)
          │                │                │
          │                │            Valid JSON & Schema?
          │                │               ├── YES ──► Return Local LLM Verdict
          │                │               └── NO ──► Repair Retry (1x) ──► Fail ──► Fallback to Mock
          │                │
          │                └── NO ──► Fallback to Mock
          │
          └── NO (or on failure) ──► Return MockJudgeProvider Verdict
```

---

## 4. Security & Privacy Controls

1. **Client-Side Vision Processing**: Camera frames are processed strictly in local browser memory via `@mediapipe/tasks-vision`. No frames, images, or video streams leave the browser.
2. **Zero Biometric / Identity Recognition**: Vision detection is restricted to 5 generic posture/pose events (`RIGHT_HAND_RAISED`, `LEFT_HAND_RAISED`, `BOTH_HANDS_RAISED`, `HAND_ON_HEAD`, `PERSON_PRESENT`). No face recognition, facial landmarking, or identity tracking is present.
3. **Payload Sanitization**: Server responses return sanitized JSON error messages, preventing stack traces, system paths, or environment secrets from leaking.
4. **Rate & Size Protections**: `express.json({ limit: "100kb" })` restricts input body sizes across all API endpoints.

---

## 5. Deployment Considerations

- **Server Environment**: Node.js 18+ runtime with Express.
- **Port & Host**: Backend runs on `PORT` (default 3000) binding to `0.0.0.0` or `localhost`.
- **Environment Variables**:
  - `JUDGE_PROVIDER`: Set to `"mock"` for competition demo environments without Ollama, or `"local"` when running Ollama locally.
  - `OLLAMA_BASE_URL`: Defaults to `http://localhost:11434`.
  - `OLLAMA_MODEL`: Defaults to `llama3.2`.
  - `VITE_API_URL`: Configures frontend API client base URL.
- **Static Asset Delivery**: In production, `npm run build` compiles Vite frontend to `dist/`, served statically by Express or any static host.

---

## 6. Known Limitations

- **In-Memory Session Storage**: Tribunal sessions exist in server memory. Server restarts clear active session history (by design, keeping zero database footprint).
- **Webcam Hardware Access**: Real gesture detection requires browser camera permissions and adequate ambient lighting.

---

## 7. Competition-Day Presentation Checklist

- [ ] Verify backend is running: `npm run dev` in `backend/` (Port 3000).
- [ ] Verify frontend is running: `npm run dev` in `frontend/` (Port 5173).
- [ ] For guaranteed presentation demo, navigate to `http://localhost:5173/?demo=true`.
- [ ] Click **START DEMO** to load "THE MIDNIGHT CAKE INCIDENT" with pre-loaded Exhibit A.
- [ ] Click **SIMULATE GESTURE (RIGHT HAND)** to demonstrate local computer vision observation.
- [ ] Click **CALL WITNESS** to submit roommate deposition.
- [ ] Click **BEGIN DELIBERATION** to trigger verdict generation (utilizes local LLM if online, or instant Mock Judge fallback).
- [ ] Click **RESET CASE** to verify state machine reset capability.
