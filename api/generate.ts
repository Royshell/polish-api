import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GROQ_ENDPOINT, GROQ_MODEL, SYSTEM_PROMPT } from "./consts";


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── CORS — allow the extension to call this endpoint ──────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // ── Validate input ─────────────────────────────────────────────────────
  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  // ── API key from Vercel environment variable — never in code ──────────
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[Polish API] GROQ_API_KEY not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  // ── Call Groq ──────────────────────────────────────────────────────────
  try {
    const groqRes = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Style request: "${prompt.trim()}"\n\nReturn only the CSS.`,
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      if (groqRes.status === 401) {
        return res.status(502).json({ error: "Invalid Groq API key" });
      }
      if (groqRes.status === 429) {
        return res
          .status(429)
          .json({ error: "Rate limit — try again shortly" });
      }
      return res
        .status(502)
        .json({ error: err?.error?.message ?? `Groq error ${groqRes.status}` });
    }

    const data = await groqRes.json();
    let css: string = data.choices?.[0]?.message?.content ?? "";

    // Strip any markdown fences the model might add despite instructions
    css = css
      .replace(/^```[\w]*\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    return res.status(200).json({ css });
  } catch (err) {
    console.error("[Polish API] fetch error:", err);
    return res.status(500).json({ error: "Failed to reach Groq" });
  }
}
