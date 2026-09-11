# Human Tribunal — Competition Demo Guide

## Overview

**Human Tribunal** is an absurd automated courtroom powered by real computer vision, a local AI Judge, and a deterministic Absurdity Engine. It evaluates trivial human decisions with extreme bureaucratic gravity.

This guide covers everything needed to run a live competition demo.

---

## Prerequisites

| Requirement | Version |
| :--- | :--- |
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Webcam | Optional (mock fallback available) |
| Ollama + llama3.2 | Optional (mock judge fallback available) |

---

## Starting the Project

**Terminal 1 — Backend:**
```bash
cd e:/development/useless/backend
npm install
npm run dev
```
Backend runs at: `http://localhost:3000`

**Terminal 2 — Frontend:**
```bash
cd e:/development/useless/frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## Enabling Demo Mode

Navigate to:
```
http://localhost:5173/?demo=true
```

Demo mode activates **automatically** from the URL parameter. No login or configuration required.

**What changes in demo mode:**
- A `COMPETITION DEMO MODE — ACTIVE` banner appears at the top
- The `COURT CLERK CONTROLS` panel appears with 5 contextual buttons
- The lobby shows a demo guidance box instead of the normal "File A Case" button
- All other tribunal functionality remains unchanged

---

## Recommended Demo Sequence (8 Steps)

### Step 1 — START DEMO
Click **[ START DEMO ]** in the COURT CLERK CONTROLS panel.

→ The system automatically:
- Creates a new tribunal session
- Files the case: **THE MIDNIGHT CAKE INCIDENT**
- Adds **EXHIBIT A — Empty Cake Container** to evidence

**What the audience sees:**
> *The Evidence Registry view loads with the pre-filed case and Exhibit A already entered into the record.*

---

### Step 2 — Show EXHIBIT A
Point to the evidence exhibit card on screen.

**Explain to audience:**
> *"The defendant is charged with consuming the final slice of cake at 3 AM. Exhibit A — an empty glass container with frosting residue — has been entered into the record."*

---

### Step 3 — ENTER CAMERA OBSERVATION
Click **[ ENTER CAMERA OBSERVATION ]** in the Clerk Controls panel.

→ The system adds **EXHIBIT B — Raised Right Hand** (clearly labelled as SIMULATED).

**If real webcam is available:**
- Click **Enable Observer** in the Courtroom Observer section first
- Raise your right hand → MediaPipe detects it → Exhibit B appears automatically
- Then use the Clerk Controls button to advance if needed

**If no webcam:**
- The SIMULATED observation creates Exhibit B labelled with `isMock: true`
- The exhibit card clearly says "SIMULATED"

**What the audience sees:**
> *A new exhibit appears: "📷 SOURCE: COURTROOM OBSERVER" — the AI noticed the defendant raising their right hand.*

---

### Step 4 — CALL WITNESS
Click **[ CALL WITNESS ]** in the Clerk Controls panel.

→ The system automatically adds sworn testimony from **Roommate**:
> *"I heard suspicious chewing at approximately 3:00 AM. There was cake involved. I am certain."*

**What the audience sees:**
> *The testimony view shows the Roommate's statement entered into the official court record.*

---

### Step 5 — BEGIN DELIBERATION
Click **[ BEGIN DELIBERATION ]** in the Clerk Controls panel.

→ The AI Judge begins reviewing all evidence. The theatrical deliberation animation plays:
- *"Reviewing submitted Exhibits A–D..."*
- *"Consulting the courtroom observer..."*
- *"Questioning the absurd evidence under oath..."*

---

### Step 6 — AI Judge Produces Verdict
After deliberation (~3 seconds), the verdict screen appears automatically.

**What the audience sees:**
- `GUILTY AS CHARGED` (or `NOT GUILTY`)
- Confidence percentage bar
- Judicial reasoning referencing specific exhibits
- **COURTROOM SUSPICION ASSESSMENT** — absurdity offense label and suspicion score
- The official absurd sentence (e.g., *"Sentenced to fold fitted sheets for eternity"*)

**Explain:**
> *"The local AI Judge — running completely offline — has reviewed the evidence and rendered a verdict."*

---

### Step 7 — Highlight Key Features
While the verdict is on screen, point out:

1. **Judge Engine badge** — shows `LOCAL AI (llama3.2)` or `DETERMINISTIC FALLBACK`
2. **Exhibit Weight Analysis** — AI's assessment of each piece of evidence
3. **Courtroom Suspicion Assessment** — absurdity score calculated deterministically
4. **Court's Comment** — the tribunal's official absurd interpretation

---

### Step 8 — RESET CASE
Click **[ RESET CASE ]** in the Clerk Controls panel (or click **"CLOSE CASE & START NEW TRIBUNAL"**).

→ The session closes, all evidence and testimony is cleared, and the lobby reappears.

Click **[ START DEMO ]** to immediately run the entire flow again.

---

## Using the Real Webcam (Path A)

1. Navigate to `http://localhost:5173/?demo=true`
2. Click **[ START DEMO ]** → evidence screen appears
3. In the **Courtroom Observer** section, click **[ Enable Observer ]**
4. Grant camera permission
5. **Raise your right hand** → MediaPipe detects the gesture locally
6. **Exhibit B** appears automatically: *"Raised Right Hand — ENTERED AS EXHIBIT B"*
7. Continue with **[ CALL WITNESS ]** → **[ BEGIN DELIBERATION ]**

> **Camera Privacy:** All processing is done locally using WebAssembly (MediaPipe). No video frames are uploaded, stored, or transmitted to any server.

---

## Mock Camera Fallback (Path B)

If camera is unavailable:

1. Click **[ ENTER CAMERA OBSERVATION ]** in the Clerk Controls panel
2. A simulated `RIGHT_HAND_RAISED` observation is entered as **EXHIBIT B**
3. The exhibit is labelled with `isMock: true` and the description says **SIMULATED**
4. The tribunal continues normally — all evidence flows to the AI Judge

> **Honesty policy:** The simulated observation is clearly labelled. We do not pretend it came from a real camera.

---

## Local AI Judge

**If Ollama is running with llama3.2:**
```bash
ollama pull llama3.2
ollama serve
```
The verdict will show `LOCAL AI (llama3.2)` in the Judge Engine badge.

**If Ollama is unavailable:**
The system automatically falls back to the deterministic `MockJudgeProvider`. The verdict shows `DETERMINISTIC FALLBACK`.

**No setup is required for the demo to work.** The mock judge produces consistent, contextually appropriate verdicts.

---

## Absurdity Engine

The Absurdity Engine adds comedic interpretation to the verdict. It is:
- 100% deterministic (same case = same score every time)
- Zero `Math.random()` calls
- Never alters real CV detections or factual evidence

**Toggle ON/OFF:** Click **ABSURDITY ENGINE: ON/OFF** in the Tribunal Progress header.

---

## Demo Reset Instructions

From any point in the flow:

1. Click **[ RESET CASE ]** in Clerk Controls, OR
2. Click **"⚖️ CLOSE CASE & START NEW TRIBUNAL"** in the verdict view

After reset:
- ✅ Old evidence cleared
- ✅ Old testimony cleared
- ✅ Old verdict cleared
- ✅ Camera events do not carry over
- ✅ New session ID is generated
- ✅ START DEMO immediately creates a fresh session

---

## Failure Fallbacks

| Scenario | Fallback |
| :--- | :--- |
| Ollama not running | Auto-falls to MockJudgeProvider |
| Camera permission denied | Use ENTER CAMERA OBSERVATION (simulated) |
| Camera hardware missing | Use ENTER CAMERA OBSERVATION (simulated) |
| LLM returns invalid JSON | Validation catches it → MockJudgeProvider |
| Backend temporarily down | Error displayed, retry available |
| No internet connection | App runs fully offline after `npm install` |

---

## Troubleshooting

**Backend not starting:**
```bash
cd backend && npm install && npm run dev
```

**Port conflict:**
```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

**Camera not working:**
- Use Chrome or Firefox (Safari has stricter camera policies)
- Ensure `http://localhost:5173` — camera requires localhost or HTTPS
- Use the SIMULATED button as fallback

**Verdict taking too long:**
- If Ollama is slow, wait up to 30 seconds
- If it times out, the mock judge takes over automatically

**TypeScript errors:**
```bash
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit
```

**Production build:**
```bash
cd frontend && npm run build
```
