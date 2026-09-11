import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRouter from "./routes/health.js";
import sessionRouter from "./routes/session.js";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or any localhost/127.0.0.1 origin
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback allow for dev convenience
    }
  },
  credentials: true
}));

app.use(express.json({ limit: "100kb" }));

// Routes
app.use("/api", healthRouter);
app.use("/api", sessionRouter);

// Recent Cases & SSE Live Updates
const recentCases: any[] = [];
let sseClients: express.Response[] = [];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy_key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.get("/api/cases", (req, res) => {
  res.json(recentCases);
});

app.get("/api/live-updates", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  sseClients.push(res);

  req.on("close", () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

app.post("/api/verdict", async (req, res) => {
  try {
    const { title, action, reason } = req.body;
    
    const prompt = `You are the HUMAN TRIBUNAL, a highly bureaucratic, overly serious, but fundamentally absurd courtroom judge. 
You are judging a human for a questionable decision or funny mistake.
Defendant has submitted a case:
Title: ${title}
What they did: ${action}
Why the tribunal should care: ${reason}

Deliver a verdict as a bureaucratic courtroom. 
Include the following fields in your JSON response:
- caseNumber: A fictional bureaucratic case number (e.g. "CASE NO. 409B-12").
- charges: The specific absurd charges against them.
- reasoning: The tribunal's overly serious reasoning for why this is a crime against common sense.
- finalVerdict: A short, dramatic final verdict like "GUILTY OF QUESTIONABLE DECISION-MAKING".
- sentence: A ridiculous, oddly specific sentence/punishment (e.g., "Must eat only the end pieces of bread for 2 weeks.").`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caseNumber: { type: Type.STRING },
            charges: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            finalVerdict: { type: Type.STRING },
            sentence: { type: Type.STRING },
          },
          required: ["caseNumber", "charges", "reasoning", "finalVerdict", "sentence"],
        },
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    const verdict = JSON.parse(jsonStr);

    const fullCase = {
      ...verdict,
      originalTitle: title,
      originalAction: action,
      originalReason: reason,
      timestamp: new Date().toISOString()
    };

    recentCases.unshift(fullCase);
    if (recentCases.length > 50) recentCases.pop();

    sseClients.forEach((client) => {
      client.write(`data: ${JSON.stringify(fullCase)}\n\n`);
    });

    res.json(verdict);
  } catch (error) {
    console.error("Error generating verdict:", error);
    res.status(500).json({ error: "Failed to deliberate." });
  }
});

// Global Error Handling Middleware to prevent stack trace leaks
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Error:", err.message || err);
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? "Internal Tribunal Server Error" : (err.message || "Bad Request");
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Human Tribunal Backend running on http://localhost:${PORT}`);
});
