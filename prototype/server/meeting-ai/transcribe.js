// Vercel Serverless Function
// Receives ONE short audio segment (16 kHz mono WAV, base64) from the browser
// and returns a structured, speaker-labelled transcript using the Gemini API.
//
// Requires the GEMINI_API_KEY environment variable (set in Vercel).
// Optional: GEMINI_MODEL to override the default model without a code change.
//
// The browser cuts a meeting into ~75-second segments so that every request
// stays well under Vercel's 4.5 MB request-body limit.


const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_BASE64_CHARS = 4_000_000; // ~3 MB of audio; guards the 4.5 MB body limit

const PROMPT = `You are the transcription engine of a university meeting-management system (DHA Suffa University, Karachi). The audio is one segment of a real meeting. Speakers may mix English, Urdu and Roman Urdu.

Transcribe the audio into speaker turns and return a JSON array. Each item has:
- "speaker": "Speaker 1", "Speaker 2", ... Use a new label for each distinct voice. Never guess real names.
- "start": when the turn begins inside THIS segment, formatted M:SS.
- "original": what was said, as close to verbatim as possible. Write Urdu speech in Roman Urdu (Latin letters); keep English as English.
- "english": a faithful English rendering of the turn (identical to "original" if it was already English).

Rules:
- Do not invent, summarise or "improve" content. Use "[inaudible]" for unclear speech.
- If there is no intelligible speech, return an empty array [].
- If context from the previous segment is given below, keep speaker labels consistent with it, but do NOT repeat its lines.`;

function extractLines(data) {
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  if (!text) return null;
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed)) return null;
  return parsed
    .filter((l) => l && (l.original || l.english))
    .map((l) => ({
      speaker: String(l.speaker || "Speaker 1").trim(),
      start: String(l.start || "0:00").trim(),
      original: String(l.original || l.english || "").trim(),
      english: String(l.english || l.original || "").trim(),
    }));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "The transcription service is not configured." });
  }

  const { audioBase64, mimeType, previousLines } = req.body || {};
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return res.status(400).json({ error: "No audio was received." });
  }
  if (audioBase64.length > MAX_BASE64_CHARS) {
    return res.status(413).json({ error: "The audio segment is too large." });
  }

  const context =
    Array.isArray(previousLines) && previousLines.length
      ? `\n\nContext from the previous segment (for speaker continuity only):\n${JSON.stringify(
          previousLines.slice(-4).map((l) => ({ speaker: l.speaker, english: l.english }))
        )}`
      : "";

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT + context },
                { inline_data: { mime_type: mimeType || "audio/wav", data: audioBase64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  speaker: { type: "STRING" },
                  start: { type: "STRING" },
                  original: { type: "STRING" },
                  english: { type: "STRING" },
                },
                required: ["speaker", "start", "original", "english"],
              },
            },
          },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const status = geminiRes.status;
      const detail = data?.error?.message || "Unknown error";
      if (status === 429) {
        return res.status(429).json({ error: "The transcription service is busy. Please retry shortly.", detail });
      }
      if (status === 404) {
        return res.status(502).json({
          error: "The configured transcription model is unavailable.",
          detail: `${detail} (set GEMINI_MODEL in Vercel to a current model name)`,
        });
      }
      return res.status(502).json({ error: "Transcription failed.", detail });
    }

    const lines = extractLines(data);
    if (lines === null) {
      return res.status(502).json({ error: "The transcription response could not be read." });
    }
    return res.status(200).json({ lines });
  } catch (err) {
    return res.status(500).json({ error: "Transcription failed.", detail: err.message });
  }
}
