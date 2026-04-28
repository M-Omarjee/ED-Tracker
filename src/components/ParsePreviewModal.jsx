import { useState, useEffect } from "react";

const triageOptions = ["Red", "Amber", "Green"];

/**
 * Shows the Claude-extracted clerking data in editable form before
 * applying to the patient. Trust-preserving default — the user always
 * confirms before structured data lands in the record.
 */
function ParsePreviewModal({ initialData, source, error, onCancel, onApply }) {
  const initial = initialData || {};
  const initialObs = initial.observations || {};

  const [presentingComplaint, setPresentingComplaint] = useState(
    initial.presentingComplaint || ""
  );
  const [obs, setObs] = useState({
    rr: initialObs.rr || "",
    spo2: initialObs.spo2 || "",
    o2: initialObs.o2 || "",
    temp: initialObs.temp || "",
    sbp: initialObs.sbp || "",
    hr: initialObs.hr || "",
    avpu: initialObs.avpu || "",
  });
  const [triage, setTriage] = useState(initial.suggestedTriage || "");

  // If parent re-runs with new data, reset internal state
  useEffect(() => {
    setPresentingComplaint(initial.presentingComplaint || "");
    setObs({
      rr: initialObs.rr || "",
      spo2: initialObs.spo2 || "",
      o2: initialObs.o2 || "",
      temp: initialObs.temp || "",
      sbp: initialObs.sbp || "",
      hr: initialObs.hr || "",
      avpu: initialObs.avpu || "",
    });
    setTriage(initial.suggestedTriage || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleApply = () => {
    onApply({
      presentingComplaint: presentingComplaint.trim(),
      observations: obs,
      triage: triage || null,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <h2>Review extracted data</h2>
          <button onClick={onCancel}>Close</button>
        </div>

        {source === "claude" && (
          <div className="ai-badge ai-badge-success">
            ✨ Extracted by Claude — please review before applying
          </div>
        )}
        {source === "fallback" && (
          <div className="ai-badge ai-badge-warn">
            ⚠️ Extraction unavailable
            {error ? `: ${error}` : ""}. Fields are blank — fill manually.
          </div>
        )}

        <div className="add-form" style={{ marginTop: 12 }}>
          <label className="full-row">
            Presenting complaint
            <input
              type="text"
              value={presentingComplaint}
              onChange={(e) => setPresentingComplaint(e.target.value)}
              placeholder="e.g. Central chest pain"
            />
          </label>

          <label>
            RR
            <input
              type="text"
              value={obs.rr}
              onChange={(e) => setObs((o) => ({ ...o, rr: e.target.value }))}
            />
          </label>
          <label>
            SpO₂
            <input
              type="text"
              value={obs.spo2}
              onChange={(e) =>
                setObs((o) => ({ ...o, spo2: e.target.value }))
              }
            />
          </label>
          <label>
            O₂
            <input
              type="text"
              value={obs.o2}
              onChange={(e) => setObs((o) => ({ ...o, o2: e.target.value }))}
              placeholder="Air / 2L NC"
            />
          </label>
          <label>
            Temp
            <input
              type="text"
              value={obs.temp}
              onChange={(e) =>
                setObs((o) => ({ ...o, temp: e.target.value }))
              }
            />
          </label>
          <label>
            SBP
            <input
              type="text"
              value={obs.sbp}
              onChange={(e) =>
                setObs((o) => ({ ...o, sbp: e.target.value }))
              }
            />
          </label>
          <label>
            HR
            <input
              type="text"
              value={obs.hr}
              onChange={(e) => setObs((o) => ({ ...o, hr: e.target.value }))}
            />
          </label>
          <label>
            AVPU
            <input
              type="text"
              value={obs.avpu}
              onChange={(e) =>
                setObs((o) => ({ ...o, avpu: e.target.value }))
              }
              placeholder="A / V / P / U"
            />
          </label>
          <label>
            Suggested triage
            <select
              value={triage}
              onChange={(e) => setTriage(e.target.value)}
            >
              <option value="">— Don't change —</option>
              {triageOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </label>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <button className="ghost-btn-dark" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleApply}>
            Apply to patient
          </button>
        </div>
      </div>
    </div>
  );
}

export default ParsePreviewModal;