import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const recentCases: any[] = [];
let sseClients: express.Response[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "100kb" }));

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
