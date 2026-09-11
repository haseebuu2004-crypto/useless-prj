# Human Tribunal — Technical Q&A Guide

Concise, accurate answers to expected technical questions from competition judges.

---

### 1. Why use MediaPipe?
**Answer**: MediaPipe Tasks Vision provides browser-native, WebAssembly-accelerated pose landmarker capabilities. It delivers 30 FPS pose tracking directly in client JavaScript with zero server GPU overhead and zero network latency.

### 2. Does the camera footage leave the device?
**Answer**: Never. 100% of video frame processing occurs inside WebAssembly memory within the user's browser. Only structured text JSON metadata (e.g. `RIGHT_HAND_RAISED`) is sent to the backend.

### 3. How does gesture detection work?
**Answer**: `gestureDetector.ts` computes geometric vector relationships between normalized 3D pose landmarks (e.g., comparing wrist $y$-coordinates relative to shoulder and ear landmarks).

### 4. Where is the dataset?
**Answer**: We do not require a custom dataset. We utilize MediaPipe's pre-trained 33-point pose landmark model (`pose_landmarker.task`) combined with rule-based geometric gesture heuristics.

### 5. Did you train your own model?
**Answer**: No. We leveraged Google's open-source MediaPipe pre-trained pose model and built our own custom client-side gesture classification engine on top of its keypoint outputs.

### 6. Why is CV in the frontend?
**Answer**: Frontend CV guarantees user privacy, eliminates server bandwidth/processing costs for raw video streams, reduces latency to 0ms, and allows the backend to remain lightweight.

### 7. What happens if the camera fails or permission is denied?
**Answer**: The application degrades gracefully. The user receives a clear "Courtroom Observer Blind" notification, and the tribunal continues using manual exhibit submission or mock gesture simulation buttons.

### 8. What happens if Ollama fails or is offline?
**Answer**: `JudgeService` checks Ollama health via a 2-second timeout call. If Ollama is offline or returns malformed JSON, the backend automatically falls back to `MockJudgeProvider` without crashing or returning errors to the user.

### 9. Why use a local LLM?
**Answer**: Local LLMs (Ollama + `llama3.2`) allow zero-paid-API operation, complete data privacy, and full offline execution without relying on third-party cloud AI vendors.

### 10. Why have a Mock Judge?
**Answer**: `MockJudgeProvider` guarantees 100% uptime and instant verdicts during live presentation demos, public web hosting, or environments without local LLM installations.

### 11. How does the backend work?
**Answer**: Built with Node.js, Express, and TypeScript. It enforces a strict tribunal session state machine, manages exhibit indexing, executes suspicion calculations, and delegates case evaluation to the configured `JudgeProvider`.

### 12. Why is there no database?
**Answer**: To maintain a zero-dependency, zero-maintenance architecture suitable for TinkerHub Useless Projects. Sessions are stored in-memory, keeping latency minimal and deployment simple.

### 13. How does the state machine work?
**Answer**: `sessionService.ts` maintains a whitelist transition table (`LOBBY → CASE_FILED → EVIDENCE → TESTIMONY → DELIBERATION → VERDICT → CLOSED`). Illegal transitions return HTTP `409 Conflict`.

### 14. How does evidence work?
**Answer**: Exhibits are assigned sequential alphabetical exhibit numbers (`EXHIBIT A`, `EXHIBIT B`). Each item receives deterministic relevance and credibility scores based on string hashes of its content.

### 15. How does the Absurdity Engine work?
**Answer**: It calculates a deterministic suspicion score ($0.05 - 0.99$) using pure string hashing (`hashString()`) on case text and evidence counts. It contains no `Math.random()`, ensuring reproducible rulings.

### 16. How is the system secured?
**Answer**: Express body parsing is capped at `100kb`. Global error handling middleware intercepts uncaught exceptions to prevent stack trace leaks. State transitions prevent closed-session modification.

### 17. What happens during public deployment?
**Answer**: The React frontend is deployed as static assets (Vercel/Netlify), and the Express backend runs on container hosting (Render/Cloud Run). `JUDGE_PROVIDER` defaults to `mock` for 100% cloud availability.

### 18. What makes this technically interesting?
**Answer**: It combines WebAssembly computer vision, decoupled AI provider abstractions, deterministic scoring algorithms, and strict state-machine engineering inside an absurd, theatrical web application.

### 19. Why is the project useless?
**Answer**: Because it uses state-of-the-art computer vision and local AI to seriously prosecute people for eating late-night birthday cake and raising their hand without permission!
