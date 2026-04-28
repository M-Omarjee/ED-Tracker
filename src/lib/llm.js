/**
 * Frontend client for the /api/extract-clerking serverless function.
 *
 * Calls our Vercel function (which calls Claude server-side). The
 * Anthropic API key never touches the browser bundle.
 */

export async function extractClerking(text) {
    if (!text || !text.trim()) {
      return {
        parsed: {},
        source: "fallback",
        error: "Please enter some text first",
      };
    }
  
    try {
      const res = await fetch("/api/extract-clerking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
  
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        return {
          parsed: {},
          source: "fallback",
          error: errBody.error || `Request failed with status ${res.status}`,
        };
      }
  
      return await res.json();
    } catch (err) {
      console.error("extractClerking failed:", err);
      return {
        parsed: {},
        source: "fallback",
        error: err.message || "Network error",
      };
    }
  }

  /**
 * Calls our serverless function to generate a Claude-powered ED
 * discharge summary from a full patient record.
 */
export async function generateDischargeSummary(patient) {
    if (!patient) {
      return {
        summary: null,
        source: "fallback",
        error: "No patient provided",
      };
    }
  
    try {
      const res = await fetch("/api/generate-discharge-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient }),
      });
  
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        return {
          summary: null,
          source: "fallback",
          error: errBody.error || `Request failed with status ${res.status}`,
        };
      }
  
      return await res.json();
    } catch (err) {
      console.error("generateDischargeSummary failed:", err);
      return {
        summary: null,
        source: "fallback",
        error: err.message || "Network error",
      };
    }
  }