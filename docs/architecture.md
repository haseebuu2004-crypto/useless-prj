# Human Tribunal — System Architecture

## System Overview

Human Tribunal is a full-stack web application that evaluates trivial human decisions through an absurd automated courtroom powered by real computer vision, a local AI Judge, and a deterministic Absurdity Engine.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        BROWSER (React)                         │
│                                                                │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │   Home   │  │ TribunalProg │  │   DemoControlPanel     │   │
│  │  (Lobby) │  │    ress      │  │  (Demo Mode Only)      │   │
│  └──────────┘  └──────────────┘  └────────────────────────┘   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    App.tsx (Root)                        │  │
│  │  useTribunalSession hook  ·  useDemoMode hook            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ SubmitForm  │  │ EvidenceForm │  │   TestimonyForm      │   │
│  │ (Case File) │  │ (Exhibits)   │  │   (Depositions)      │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│                         │                                      │
│               ┌─────────▼──────────┐                           │
│               │  CourtroomCamera   │                           │
│               │  (MediaPipe WASM)  │                           │
│               └─────────┬──────────┘                           │
│                         │                                      │
│               ┌─────────▼──────────┐                           │
│               │   VisionService    │  ← gestureDetector        │
│               │   (Event Pipeline) │  ← 5s cooldown            │
│               │                   │  ← confidence threshold    │
│               └─────────┬──────────┘                           │
│                         │                                      │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │               sessionApi.ts (HTTP Client)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │ HTTP / REST
                          ▼
┌────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express + TypeScript)               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   routes/session.ts                      │  │
│  │                                                          │  │
│  │  POST /api/session/start          (new session)          │  │
│  │  POST /api/session/demo/start     (one-shot demo)        │  │
│  │  POST /api/session/:id/case       (file case)            │  │
│  │  POST /api/session/:id/evidence   (add exhibit)          │  │
│  │  DELETE /api/session/:id/evidence/:eid                   │  │
│  │  POST /api/session/:id/testimony  (deposition)           │  │
│  │  POST /api/session/:id/deliberate (start judge)          │  │
│  │  POST /api/session/:id/verdict    (fetch ruling)         │  │
│  │  POST /api/session/:id/close      (archive)              │  │
│  │  GET  /api/judge/status                                  │  │
│  │  POST /api/judge/toggle-absurdity                        │  │
│  └─────────────────────┬────────────────────────────────────┘  │
│                        │                                       │
│  ┌─────────────────────▼────────────────────────────────────┐  │
│  │                services/sessionService.ts                │  │
│  │            (in-memory session store + lifecycle)          │  │
│  └─────────────────────┬────────────────────────────────────┘  │
│                        │                                       │
│          ┌─────────────┴───────────────┐                       │
│          │                             │                       │
│  ┌───────▼───────┐          ┌──────────▼──────────────────┐   │
│  │  Evidence     │          │      JudgeService            │   │
│  │  Service      │          │  (evaluateCase)              │   │
│  │               │          │                              │   │
│  │  createEvid   │          │   ┌───────────────────────┐  │   │
│  │  entItem()    │          │   │   JudgeProvider (if)   │  │   │
│  └───────────────┘          │   │                       │  │   │
│                             │   │  LocalLLMJudgeProvider │  │   │
│                             │   │  → Ollama HTTP call    │  │   │
│                             │   │  → JSON parse+validate │  │   │
│                             │   │  → Anti-hallucination  │  │   │
│                             │   │                       │  │   │
│                             │   │  MockJudgeProvider    │  │   │
│                             │   │  → Deterministic      │  │   │
│                             │   │  → Always available   │  │   │
│                             │   └───────────────────────┘  │   │
│                             │                              │   │
│                             │   ┌───────────────────────┐  │   │
│                             │   │   AbsurdityEngine     │  │   │
│                             │   │   (deterministic)     │  │   │
│                             │   │                       │  │   │
│                             │   │  hashString()         │  │   │
│                             │   │  suspicion scoring    │  │   │
│                             │   │  offense mapping      │  │   │
│                             │   │  harmless sentences   │  │   │
│                             │   └───────────────────────┘  │   │
│                             └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP (optional)
                          ▼
              ┌───────────────────────┐
              │  Ollama (local LLM)   │
              │  llama3.2 / mistral   │
              │  localhost:11434      │
              └───────────────────────┘
```

---

## Data Flow: Evidence → Verdict

```
User/Camera Input
      │
      ▼
EvidenceItem {
  id, exhibit_number, type,
  title, description, source,
  relevance, credibility,
  metadata (gesture, confidence, isMock...)
}
      │
      ▼
JudgeInput {
  case_data: { title, action, reason }
  evidence:  EvidenceItem[]
  testimony: TestimonyItem[]
}
      │
      ├─── AbsurdityEngine.evaluate()
      │         ↓
      │    AbsurdityContext {
      │      offense_type, offense_label,
      │      suspicion_score (0-1, deterministic),
      │      classification, court_comment,
      │      harmless_sentence
      │    }
      │
      ├─── buildJudgePrompt(input, absurdityContext)
      │         ↓
      │    Full structured text prompt
      │
      └─── JudgeProvider.evaluateCase()
                ↓
           JudgeVerdict {
             decision: GUILTY | NOT_GUILTY | MISTRIAL,
             confidence: 0-1,
             reasoning: string[],
             evidence_assessment: [...],
             testimony_assessment: [...],
             sentence: string,
             provider: "mock" | "local-llm",
             absurdity_context: AbsurdityContext
           }
```

---

## Tribunal Session State Machine

```
LOBBY ──► CASE_FILED ──► EVIDENCE ──► TESTIMONY ──► DELIBERATION ──► VERDICT ──► CLOSED
  ▲                                                                              │
  └──────────────────────────────── reset (frontend only) ────────────────────────┘
```

State transitions are validated server-side. Invalid transitions return HTTP 400.

---

## Key Design Principles

| Principle | Implementation |
| :--- | :--- |
| **No paid APIs** | Ollama (local LLM) + MediaPipe (WASM) + in-memory sessions |
| **AI is replaceable** | `JudgeProvider` interface — swap implementations without changing routes |
| **Fallback-first** | Every component degrades gracefully (camera → mock, LLM → mock judge) |
| **Zero Math.random()** | AbsurdityEngine uses deterministic string hashing |
| **Privacy** | No video frames leave the browser. Camera is optional. |
| **Offline capable** | After `npm install`, runs fully without internet |

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS (paper/courtroom theme) |
| Animation | Framer Motion |
| Computer Vision | MediaPipe Tasks Vision (WebAssembly, browser-local) |
| Backend | Node.js + Express + TypeScript |
| Session Storage | In-memory (no database) |
| Local AI | Ollama (optional) |
| AI Fallback | Deterministic MockJudgeProvider |

---

## Production & Reliability Architecture

- **Client-Side Computer Vision**: MediaPipe Pose Landmarker executes entirely inside WebAssembly in the user's browser.
- **Structured Observation Payloads**: No video frames or raw images are uploaded, stored, or transmitted to the backend or LLM. Only structured text JSON metadata events (e.g. `RIGHT_HAND_RAISED`) are sent over the REST API.
- **Optional Local LLM Runtime**: Ollama integration runs over local HTTP (`http://localhost:11434`). If Ollama is unreachable, times out, or returns malformed JSON, the system automatically falls back to `MockJudgeProvider`.
- **Mock Judge Fallback**: `MockJudgeProvider` is built-in, zero-dependency, and always available. The app remains fully functional without Ollama installed.
- **Deterministic Absurdity Engine**: Suspicion scoring and offense classification use string-hashing without `Math.random()`, ensuring reproducible rulings.
- **Demo Mode Resilience**: Competition Demo Mode (`?demo=true` & `POST /api/session/demo/start`) provides a zero-dependency, fail-safe path to a verdict even without physical camera hardware or local LLMs.
- **In-Memory State**: Session state is held in-memory without external database dependencies, optimized for low latency and simplicity during live competition demos.

