/**
 * POST /api/generate-discharge-summary
 * Body: { patient: <patient object> }
 * Returns: {
 *   summary: {
 *     diagnosis: string,
 *     investigations: string,
 *     management: string,
 *     plan: string,
 *     followUp: string,
 *     gpLetter: string,
 *   },
 *   source: 'claude' | 'fallback',
 *   error?: string,
 * }
 */
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are an experienced UK Emergency Department clinician writing a discharge summary. The user provides a JSON object describing a patient's ED stay. You produce a structured discharge document suitable for handover to the patient's GP.

Style:
- Concise, factual, clinical UK English
- Use SI units, NHS conventions, MIMS abbreviations where standard (e.g. PO, IV, IM, BD, TDS)
- No speculation beyond what the data supports
- Reference NEWS scores and trends explicitly
- Reference blood results explicitly when available — quote actual values (e.g. "Troponin 8 ng/L (normal)", "CRP 12 mg/L"), not vague phrases. Distinguish lab bloods from blood gas (note gas type: VBG/ABG/CBG)
- Note the timing of bloods: if sampleTakenAt and resultsAvailableAt are both present, the time-to-result is clinically relevant
- If observations or bloods were never recorded, say "observations not documented" / "no bloods recorded" rather than inventing values

Required output: a single JSON object with exactly these keys, no markdown, no commentary:

{
  "diagnosis": "<working diagnosis or differentials, e.g. 'Suspected acute coronary syndrome — for cardiology follow-up' or 'Likely viral URTI'>",
  "investigations": "<bullet-style summary of investigations performed and key results, formatted as a single multi-line string with line breaks. Reference completed tasks (bloods, imaging) and any documented results from the notes.>",
  "management": "<what was done in ED, e.g. 'Aspirin 300mg PO, GTN spray, IV access, troponin sent'>",
  "plan": "<discharge plan, e.g. 'Discharged home with safety-netting advice for return chest pain or new SOB'>",
  "followUp": "<follow-up arrangements, e.g. 'GP review in 1 week. Cardiology OPA via referral.'>",
  "gpLetter": "<a brief plain-English paragraph for the GP, third person, summarising the visit in one paragraph (4-6 sentences). Should read as a complete letter opener.>"
}

If the patient record is too thin to write a meaningful discharge (e.g. no notes, no observations), still return the JSON but note this honestly in the relevant fields. Do not refuse.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }

  const patient = body?.patient;
  if (!patient || typeof patient !== "object") {
    return res
      .status(400)
      .json({ error: "Missing or invalid 'patient' field" });
  }

  // Build a focused payload — strip internal UI state, keep clinical data
  // Build a focused payload — strip internal UI state, keep clinical data
  const payload = {
    name: patient.name,
    patientId: patient.patientId,
    presentingComplaint: patient.presentingComplaint,
    triage: patient.triage,
    timeInDept: patient.timeInDept,
    notes: patient.notes || [],
    tasks: patient.tasks || {},
    imagingText: patient.imagingText || "",
    referralChoice: patient.referralChoice || "",
    newsScore: patient.newsScore,
    newsHistory: patient.newsHistory || [],
    news2Scale: patient.news2Scale || "scale1",
    bloodResults: patient.bloodResults || [],
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set, returning fallback");
    return res.status(200).json({
      summary: fallbackSummary(payload),
      source: "fallback",
      error: "API key not configured on server",
    });
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Patient record:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock) throw new Error("No text content in Claude response");

    let summary;
    try {
      summary = JSON.parse(textBlock.text);
    } catch (err) {
      const stripped = textBlock.text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      summary = JSON.parse(stripped);
    }

    return res.status(200).json({ summary, source: "claude" });
  } catch (err) {
    console.error("Claude generate-discharge-summary failed:", err);
    return res.status(200).json({
      summary: fallbackSummary(payload),
      source: "fallback",
      error: err.message || "Claude API call failed",
    });
  }
}

function fallbackSummary(payload) {
  const obsLines = (payload.newsHistory || [])
    .map(
      (e) =>
        `${e.time} — RR ${e.rr || "?"}, SpO2 ${e.spo2 || "?"}%, BP ${
          e.sbp || "?"
        }, HR ${e.hr || "?"}, Temp ${e.temp || "?"}, AVPU ${
          e.avpu || "?"
        }, NEWS ${e.score || "?"}`
    )
    .join("\n");

  const noteLines = (payload.notes || [])
    .map((n) => `${n.time}: ${n.text}`)
    .join("\n");

  const tasksDone = Object.entries(payload.tasks || {})
    .filter(([_, v]) => v)
    .map(([k]) => k)
    .join(", ");

  return {
    diagnosis: `Presenting complaint: ${
      payload.presentingComplaint || "not documented"
    }. AI summary unavailable — manual review required.`,
    investigations: tasksDone
      ? `Tasks completed: ${tasksDone}.${
          payload.imagingText ? ` Imaging: ${payload.imagingText}.` : ""
        }`
      : "No investigations documented.",
    management: noteLines || "No management notes documented.",
    plan: "Manual completion required.",
    followUp: payload.referralChoice
      ? `Referral noted to: ${payload.referralChoice}.`
      : "No follow-up plan documented.",
    gpLetter: `${payload.name || "Patient"} attended ED with ${
      payload.presentingComplaint || "presenting complaint not documented"
    }. ${
      obsLines ? `Observations recorded:\n${obsLines}\n\n` : ""
    }Notes:\n${noteLines || "No notes documented."}`,
  };
}