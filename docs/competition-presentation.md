# Human Tribunal — 2-Minute Competition Presentation Script

> **Target Time**: 2 minutes 30 seconds  
> **Format**: Live Demo + Pitch  
> **URL**: `http://localhost:5173/?demo=true`

---

## 1. The Hook (0:00 - 0:15)
*"Judges, late last night at 3:00 AM, a crime was committed. A human snuck into the kitchen, opened the refrigerator, and consumed the final slice of birthday cake. In any ordinary court, this case would be dismissed. But welcome to **Human Tribunal**—the world's first automated AI courtroom designed specifically to prosecute useless human behavior!"*

---

## 2. The Problem (0:15 - 0:30)
*"Every day, millions of people commit minor social infractions: leaving 1 second on the microwave timer, raising their hand without permission, or folding fitted sheets poorly. Society has no legal recourse for these absurd atrocities. We built Human Tribunal to bring bureaucratic justice to everyday life."*

---

## 3. What Human Tribunal Does (0:30 - 0:45)
*"Human Tribunal is a full-stack courtroom experience. Defendants file their case, present evidence, call witnesses, and submit to real-time Computer Vision observation. Then, an AI Judge deliberates and delivers a binding, completely useless sentence."*

---

## 4. Live Demo Sequence (0:45 - 1:30)

*(Action: Open `http://localhost:5173/?demo=true` and click **START DEMO**)*

- **Case Filed**: *"Here is our live case: 'THE MIDNIGHT CAKE INCIDENT'. Exhibit A is already in evidence—an empty cake container with residual frosting."*
- **Computer Vision Observation**: *(Action: Click 'SIMULATE GESTURE (RIGHT HAND)')*  
  *"Now watch our Courtroom Observer! The observer just caught the defendant raising their right hand in a gesture of unauthorized elevation. It enters the record as Exhibit B."*
- **Witness Deposition**: *(Action: Click 'CALL WITNESS')*  
  *"Next, we call a witness. The roommate testifies under oath: 'I heard suspicious chewing at 3:00 AM.'"*
- **Deliberation & Verdict**: *(Action: Click 'BEGIN DELIBERATION')*  
  *"Now we hand the docket to the AI Judge! The judge evaluates evidence, assesses witness credibility, and calculates suspicion..."*
- **Verdict Displayed**:  
  *"Verdict: **GUILTY!** Suspicion Score: **88% (ABSURDLY GUILTY)**. Charges: Unauthorized Hand Elevation. Sentence: 'Sentenced to write a 500-word apology to the office microwave!'"*

---

## 5. Computer Vision Architecture (1:30 - 1:45)
*"Under the hood, our Computer Vision system uses MediaPipe Pose Landmarker running 100% locally inside the browser via WebAssembly. It tracks 33 body keypoints in real time to detect gestures like hand-raising and distress postures. Crucially, **zero camera frames ever leave your device**—only structured text observations reach the court."*

---

## 6. AI Judge & Fallback System (1:45 - 2:00)
*"Our AI Judge runs over a decoupled service architecture. It can use a local Ollama LLM (`llama3.2`) for offline AI reasoning, but if Ollama isn't available, our zero-dependency **MockJudgeProvider** automatically takes over. The court never crashes, never stalls, and never requires a paid API."*

---

## 7. The Absurdity Engine (2:00 - 2:15)
*"To calculate guilt, we built a deterministic **Absurdity Engine**. Using pure string hashing without `Math.random()`, it computes reproducible suspicion scores and assigns harmless punishments—from folded fitted sheets to houseplant apologies."*

---

## 8. Why It Is Intentionally Useless (2:15 - 2:30)
*"Human Tribunal takes high-performance computer vision, local LLM architectures, and state-machine engineering, and applies them to something completely ridiculous. It proves that software can be technically bulletproof while remaining delightfully absurd."*

---

## 9. Closing Line (2:30)
*"Thank you, Judges. The Court is now adjourned—please step away from the birthday cake!"*
