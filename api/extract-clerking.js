/**
 * POST /api/extract-clerking
 * Body: { text: string }
 * Returns: {
 *   parsed: {
 *     presentingComplaint?: string,
 *     observations?: { rr, spo2, o2, temp, sbp, hr, avpu },
 *     suggestedTriage?: 'Red' | 'Amber' | 'Green',
 *   },
 *   source: 'claude' | 'fallback',
 *   error?: string,
 * }
 */
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are an assistant helping clinicians in a UK Emergency Department. The user pastes a free-text clerking narrative about a single patient. Your job is to extract structured data so the form can be pre-filled.

Extract only what the text actually says. If a field is not mentioned, omit it (do not guess). Use null for unknown observations.

Required output: a single JSON object matching this schema. No prose, no markdown fences, no commentary — just the JSON.

{
  "presentingComplaint": "<short noun phrase, e.g. 'Central chest pain' or 'RIF pain' — concise, headline-style>",
  "observations": {
    "rr": "<respiratory rate as integer string, e.g. '22'>" | null,
    "spo2": "<SpO2 % as integer string, e.g. '94'>" | null,
    "o2": "<oxygen support: 'Air' if breathing room air, otherwise the device + flow, e.g. '2L NC' or '15L NRB'>" | null,
    "temp": "<temperature in Celsius as decimal string, e.g. '38.2'>" | null,
    "sbp": "<systolic BP as integer string, e.g. '110'>" | null,
    "hr": "<heart rate as integer string, e.g. '104'>" | null,
    "avpu": "<one of 'A', 'V', 'P', 'U' — derive from descriptors like 'alert' = A, 'responds to voice' = V, 'responds to pain' = P, 'unresponsive' = U>" | null
  },
  "suggestedTriage": "Red" | "Amber" | "Green" | null
}

Triage suggestion guidance (NHS standard):
- Red: immediately life-threatening (e.g. cardiac arrest, severe shock, GCS <9, sats <90% on air)
- Amber: serious, urgent (e.g. NEWS 5+, severe pain, suspected sepsis with stable obs)
- Green: stable, can wait (e.g. NEWS 0-2, minor injuries, well patient)
Suggest only if you are confident from the text. Otherwise null.`;

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse body
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }

  const text = body?.text;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Missing or empty 'text' field" });
  }
  if (text.length > 5000) {
    return res
      .status(400)
      .json({ error: "Text too long (max 5000 characters)" });
  }

  // If no API key, return a graceful fallback (so the UI can still
  // demonstrate the flow even without credentials).
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set, returning fallback response");
    return res.status(200).json({
      parsed: {},
      source: "fallback",
      error: "API key not configured on server",
    });
  }

  // Call Claude
  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    // Claude returns content as an array of blocks. We expect a single
    // text block with the JSON payload.
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock) {
      throw new Error("No text content in Claude response");
    }

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch (err) {
      // Sometimes the model wraps JSON in fences despite instructions.
      // Strip them and retry once.
      const stripped = textBlock.text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(stripped);
    }

    return res.status(200).json({ parsed, source: "claude" });
  } catch (err) {
    console.error("Claude extract-clerking failed:", err);
    return res.status(200).json({
      parsed: {},
      source: "fallback",
      error: err.message || "Claude API call failed",
    });
  }
}