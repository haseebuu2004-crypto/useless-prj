# HUMAN TRIBUNAL

> **An absurd AI-powered courtroom where completely ordinary human behavior can become evidence.**

Built for **TinkerHub Useless Projects 3.0**, Human Tribunal puts defendants on trial for hilarious, completely harmless crimes of everyday life—such as consuming the final slice of birthday cake at 3:00 AM, leaving 1 second on the microwave timer, or raising a hand without prior judicial clearance.

Underneath its absurd courtroom persona lies a robust, privacy-respecting engineering architecture featuring browser-side WebAssembly computer vision, an optional local LLM judge, and a deterministic absurdity scoring engine.

---

## Features

- ⚖️ **Absurd AI Courtroom**: Complete tribunal session state machine (`LOBBY` → `CASE_FILED` → `EVIDENCE` → `TESTIMONY` → `DELIBERATION` → `VERDICT` → `CLOSED`).
- 👁️ **Local Computer Vision**: Real-time browser gesture recognition using MediaPipe Tasks Vision WebAssembly.
- 🖐️ **Courtroom Observer**: Detects human body postures (`RIGHT_HAND_RAISED`, `LEFT_HAND_RAISED`, `BOTH_HANDS_RAISED`, `HAND_ON_HEAD`, `PERSON_PRESENT`).
- 📂 **Evidence & Deposition Engine**: Manage exhibits, exhibit numbers (`EXHIBIT A`, `EXHIBIT B`), and witness testimony.
- 🤖 **Local AI Judge**: Optional Ollama LLM integration (`llama3.2`) for case evaluation.
- 🛡️ **Zero-Dependency Mock Fallback**: Automatic, seamless fallback to built-in `MockJudgeProvider` when Ollama is unreachable or offline.
- 🧮 **Deterministic Absurdity Engine**: Suspicion scoring and offense classification using pure string hashing without `Math.random()`.
- 🎭 **Theatrical Courtroom UX**: AI Studio visual design, paper/courtroom theme, micro-animations, and courtroom-themed status notifications.
- ⚡ **Competition Demo Mode**: One-shot fail-safe presentation flow available via `http://localhost:5173/?demo=true`.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER (React + Vite)                      │
│                                                                 │
│   Webcam ──► MediaPipe Pose Landmarker (WASM)                   │
│                    │                                            │
│                    ▼                                            │
│              gestureDetector (Confidence >= 0.70, 5s Cooldown)    │
│                    │                                            │
│                    ▼                                            │
│              Structured Vision Event (JSON Event Text)          │
│                    │                                            │
│                    ▼                                            │
│              sessionApi.ts (REST HTTP Client)                   │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP / REST
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BACKEND (Node.js + Express)                     │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                 routes/session.ts                       │   │
│   └────────────────────────┬────────────────────────────────┘   │
│                            │                                    │
│   ┌────────────────────────▼────────────────────────────────┐   │
│   │             services/sessionService.ts                  │   │
│   │          (In-Memory Tribunal Session Store)             │   │
│   └────────────────────────┬────────────────────────────────┘   │
│                            │                                    │
│           ┌────────────────┴────────────────┐                   │
│           │                                 │                   │
│   ┌───────▼──────┐              ┌───────────▼───────────────┐   │
│   │  Evidence    │              │       JudgeService        │   │
│   │  Service     │              │     (evaluateCase)        │   │
│   └──────────────┘              └───────────┬───────────────┘   │
│                                             │                   │
│                                 ┌───────────┴───────────┐       │
│                                 │  LocalLLMJudgeProvider│       │
│                                 │  (Ollama HTTP API)    │       │
│                                 │         OR            │       │
│                                 │  MockJudgeProvider    │       │
│                                 │  (Emergency Fallback) │       │
│                                 └───────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

> **Privacy Guarantee**: Computer vision processing takes place 100% locally inside the browser. No raw video frames, images, or biometric features ever leave the browser or get sent to the backend/LLM.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
- **Computer Vision**: `@mediapipe/tasks-vision` (WebAssembly, browser-local).
- **Backend**: Node.js, Express, TypeScript, `dotenv`, `cors`.
- **Local AI**: Ollama (`llama3.2` / `mistral`).
- **AI Fallback**: Built-in deterministic `MockJudgeProvider`.
- **Session Storage**: In-memory session store (zero database footprint).

---

## Computer Vision Architecture

1. **Browser Webcam Feed**: Renders live video stream directly into standard HTML canvas.
2. **MediaPipe Pose Landmarker**: Processes video frames locally inside WebAssembly memory at 30 FPS.
3. **Gesture Detector**: Evaluates body keypoint coordinates against defined geometric thresholds:
   - `RIGHT_HAND_RAISED`: Wrist above shoulder level.
   - `LEFT_HAND_RAISED`: Wrist above shoulder level.
   - `BOTH_HANDS_RAISED`: Both wrists above shoulder level.
   - `HAND_ON_HEAD`: Wrist near ear/head landmarks.
   - `PERSON_PRESENT`: Pose landmarks detected.
4. **Filtering & Cooldown**: Enforces confidence threshold ($\ge 0.70$) and a 5-second cooldown to suppress duplicate gesture spam.
5. **Structured Output**: Converts detected gestures into structured exhibit metadata (`source: "CAMERA"`) sent over REST. **No camera frames are stored or uploaded.**

---

## AI Judge & Fallback System

Case evaluation is decoupled via the `JudgeProvider` interface:

- **`LocalLLMJudgeProvider`**: Connects to an optional local Ollama instance (`http://localhost:11434`). Prompts the local LLM to return structured JSON verdicts with reasoning, evidence assessments, and sentences.
- **`MockJudgeProvider`**: A zero-dependency, deterministic fallback judge.
- **Automatic Fallback**: If Ollama is offline, unreachable, or returns malformed JSON, `JudgeService` automatically intercepts the failure and falls back to `MockJudgeProvider` without crashing or interrupting the tribunal.

---

## Absurdity Engine

The **Absurdity Engine** provides humorous courtroom commentary, offense classifications, and harmless sentences:

- **Classifications**: `TOTALLY_INNOCENT`, `MILDLY_SUSPICIOUS`, `DEEPLY_CONCERNING`, `EXTREMELY_SUSPICIOUS`, `ABSURDLY_GUILTY`.
- **Deterministic Scoring**: Uses a string-hashing algorithm (`hashString()`) based on case title, description, and evidence count.
- **Zero Randomness**: Contains **no `Math.random()`**, guaranteeing that identical cases produce identical suspicion scores and sentences across runs.

---

## Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/your-username/useless.git
cd useless

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```
The backend API server will start on `http://localhost:3000`.

### 3. Start Frontend Application

```bash
cd frontend
npm run dev
```
The frontend application will start on `http://localhost:5173`.

### 4. Optional Local LLM Setup (Ollama)

```bash
# Install Ollama from https://ollama.com/
ollama pull llama3.2
ollama serve
```

---

## Competition Demo Mode

For live presentations and hackathon judging, access **Competition Demo Mode**:

👉 **`http://localhost:5173/?demo=true`**

### Demo Flow Sequence
1. **START DEMO**: One-shot bootstrap creating session and loading *"THE MIDNIGHT CAKE INCIDENT"* with Exhibit A.
2. **SIMULATE GESTURE (RIGHT HAND)**: Simulates camera observation entering Exhibit B.
3. **CALL WITNESS**: Submits roommate deposition.
4. **BEGIN DELIBERATION**: Executes AI Judge deliberation (uses Ollama or instant Mock Judge fallback).
5. **VERDICT DISPLAY**: Displays official charges, suspicion score, reasoning, and harmless sentence.
6. **RESET CASE**: Resets session back to lobby for immediate replay.

---

## Environment Variables

Copy `.env.example` to create your local `.env` configuration if needed:

```env
# JUDGE_PROVIDER: 'mock' (default fallback) or 'local' (Ollama LLM)
JUDGE_PROVIDER="mock"

# OLLAMA Configuration (Optional local LLM runtime)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"

# Backend Port Configuration
PORT=3000

# Frontend API URL Configuration
VITE_API_URL="http://localhost:3000"
```

---

## Deployment Strategy

### Public Cloud Deployment
- **Frontend**: Static hosting (e.g. Vercel, Netlify, Cloudflare Pages, or Cloud Run).
- **Backend**: Node.js container hosting (e.g. Render, Railway, Cloud Run).
- **Public AI Judge**: On public deployments without access to a local Ollama instance, `JUDGE_PROVIDER` defaults to `mock`, ensuring 100% uptime and instant verdicts.

---

## Privacy Policy

- All computer vision pose detection runs locally in the browser via WebAssembly.
- No webcam footage, video streams, or raw images are uploaded to the backend or sent to Ollama.
- No facial recognition, identity tracking, or biometric data collection is performed.
- Only text-based JSON metadata events become evidence.

---

## Known Limitations

- **In-Memory Storage**: Session state is stored in server memory. Server restarts clear active session history.
- **Camera Permissions**: Real gesture detection requires browser camera permissions and a secure context (HTTPS or localhost).
- **Ollama Availability**: Local LLM evaluation requires Ollama running on localhost. If offline, the tribunal seamlessly defaults to Mock Judge.
