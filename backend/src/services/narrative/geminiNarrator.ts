import { GoogleGenAI, Type } from "@google/genai";

export interface ObservationFact {
  event: string;
  confidence?: number;
  relative_time_seconds?: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface NarratorInput {
  observation_duration_seconds?: number;
  observations: ObservationFact[];
}

export interface CaseNarrativeOutput {
  title: string;
  action: string;
  reason: string;
  defense_prompt: string;
  manglish_reaction: string;
}

export class GeminiNarrator {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim() || apiKey === "MY_GEMINI_API_KEY" || apiKey === "dummy_key") {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "human-tribunal-backend",
        },
      },
    });
  }

  async checkHealth(): Promise<boolean> {
    return this.getClient() !== null;
  }

  async generateNarrative(input: NarratorInput): Promise<CaseNarrativeOutput> {
    const ai = this.getClient();
    if (!ai) {
      throw new Error("GEMINI NARRATOR NOT CONFIGURED: GEMINI_API_KEY is missing in backend/.env.");
    }

    const systemPrompt = `You are the HUMAN TRIBUNAL CASE NARRATOR — an absurd, dramatic, hilarious Kerala courtroom clerk.
Given a list of computer-vision observations detected from a live camera feed, generate a FRESH, ORIGINAL, CREATIVE courtroom accusation.

CRITICAL RULES:
1. Ground the accusation STRICTLY in the provided observations. Do NOT invent unrecorded events, poses, or actions.
   - If evidence says "STILLNESS", do not accuse the user of waving their hands.
   - If evidence says "LEFT_FRAME", accuse them of trying to escape the camera's jurisdiction.
   - If evidence says "CROUCHING", accuse them of suspiciously reducing their height.
2. Do NOT invent intent or motives. State behavior factually and react to it absurdly.
3. Write the explanation ('action') in natural conversational Kerala Manglish (simple everyday English mixed naturally with casual Malayalam transliteration like "Bro, court noticed...", "Enthina ingane?", "Scene serious aanu").
4. Keep English simple so anyone can understand immediately.
5. Create a fresh, creative, funny title (e.g. UPPERCASE HEADLINE).
6. Create a funny defense prompt question ('defense_prompt') asking the defendant to explain themselves.
7. Create a short Manglish observation reaction ('manglish_reaction').

Do NOT use fixed template strings. Generate fresh wording for every request.`;

    const obsText = (input.observations && input.observations.length > 0)
      ? input.observations.map((o, idx) => {
          const metaString = o.metadata ? ` (metadata: ${JSON.stringify(o.metadata)})` : "";
          return `- Observation ${idx + 1}: ${o.event} (confidence: ${o.confidence || 0.9}, time: ${o.relative_time_seconds || idx * 1.5}s)${metaString}`;
        }).join("\n")
      : "- Observation 1: PERSON_PRESENT (stillness in observation zone)";

    const promptText = `OBSERVATION DURATION: ${input.observation_duration_seconds || 7} seconds\nDETECTED FACTS:\n${obsText}`;

    const candidateModels = [
      process.env.GEMINI_MODEL || "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.7-flash",
      "gemini-3.1-flash-lite"
    ];
    const maxRetries = 5;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const currentModel = candidateModels[(attempt - 1) % candidateModels.length];
      try {
        const timeoutMs = 30000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Gemini Narrative request timed out after 30 seconds.")), timeoutMs);
        });

        const generatePromise = ai.models.generateContent({
          model: currentModel,
          contents: `${systemPrompt}\n\n${promptText}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                action: { type: Type.STRING },
                reason: { type: Type.STRING },
                defense_prompt: { type: Type.STRING },
                manglish_reaction: { type: Type.STRING },
              },
              required: ["title", "action", "reason", "defense_prompt", "manglish_reaction"]
            }
          }
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        const jsonStr = response.text?.trim() || "{}";
        const raw = JSON.parse(jsonStr);

        if (!raw || typeof raw !== "object" || !raw.title || !raw.action || !raw.reason) {
          throw new Error("Invalid narrative JSON received from Gemini AI.");
        }

        return {
          title: String(raw.title).toUpperCase(),
          action: String(raw.action),
          reason: String(raw.reason),
          defense_prompt: String(raw.defense_prompt || "Okay bro, explain yourself."),
          manglish_reaction: String(raw.manglish_reaction || "Scene serious aanu.")
        };
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          let waitMs = 2000 * attempt;
          if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
            waitMs = 3000; // rotate to next candidate model with short 3s pause
          }
          console.warn(`[GeminiNarrator] Attempt ${attempt}/${maxRetries} (${currentModel}) failed (${err.message}). Retrying with next model in ${Math.round(waitMs / 1000)}s...`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
        break;
      }
    }

    throw new Error(`Gemini Case Narrator evaluation failed: ${lastError?.message || "Unknown error"}`);
  }
}

export const geminiNarrator = new GeminiNarrator();
