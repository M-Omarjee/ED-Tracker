import { useState } from "react";

/**
 * Structured bloods entry modal.
 *
 * Future integration note: this schema is designed to map cleanly to
 * FHIR Observation resources / LOINC codes for NHS LIMS integration.
 * E.g. fbc.hb -> LOINC 718-7, ues.creatinine -> LOINC 38483-4. A
 * future iteration would replace manual entry with an LIMS pull.
 *
 * For now: all entry is manual, with two distinct timestamps
 * (sampleTakenAt + resultsAvailableAt) reflecting real ED workflow
 * where bloods are sent on the round but results return 30-90 min later.
 */

const PANELS = [
  {
    key: "fbc",
    label: "FBC",
    fields: [
      { key: "hb", label: "Hb (g/L)" },
      { key: "wbc", label: "WBC (10⁹/L)" },
      { key: "plt", label: "Plt (10⁹/L)" },
      { key: "neut", label: "Neut" },
      { key: "lymph", label: "Lymph" },
    ],
  },
  {
    key: "ues",
    label: "U&Es",
    fields: [
      { key: "na", label: "Na (mmol/L)" },
      { key: "k", label: "K (mmol/L)" },
      { key: "urea", label: "Urea (mmol/L)" },
      { key: "creatinine", label: "Creat (μmol/L)" },
      { key: "egfr", label: "eGFR" },
    ],
  },
  {
    key: "lfts",
    label: "LFTs",
    fields: [
      { key: "bili", label: "Bili (μmol/L)" },
      { key: "alt", label: "ALT (U/L)" },
      { key: "alp", label: "ALP (U/L)" },
      { key: "albumin", label: "Albumin (g/L)" },
    ],
  },
  {
    key: "inflammatory",
    label: "Inflammatory",
    fields: [{ key: "crp", label: "CRP (mg/L)" }],
  },
  {
    key: "otherMarkers",
    label: "Other markers",
    fields: [
      { key: "lactate", label: "Lactate (mmol/L)" },
      { key: "troponin", label: "Troponin (ng/L)" },
      { key: "bnp", label: "BNP (pg/mL)" },
      { key: "ddimer", label: "D-dimer (ng/mL)" },
    ],
  },
];

const GAS_TYPES = ["VBG", "ABG", "CBG"];

const GAS_FIELDS = [
  { key: "ph", label: "pH" },
  { key: "pco2", label: "pCO₂ (kPa)" },
  { key: "po2", label: "pO₂ (kPa)" },
  { key: "hco3", label: "HCO₃ (mmol/L)" },
  { key: "be", label: "Base excess" },
  { key: "lactate", label: "Lactate (mmol/L)" },
  { key: "glucose", label: "Glucose (mmol/L)" },
];

function emptyPanelValues() {
  const out = {};
  PANELS.forEach((p) => {
    out[p.key] = {};
    p.fields.forEach((f) => {
      out[p.key][f.key] = "";
    });
  });
  out.bloodGas = { type: null };
  GAS_FIELDS.forEach((f) => {
    out.bloodGas[f.key] = "";
  });
  return out;
}

// HTML datetime-local needs YYYY-MM-DDTHH:mm format (no seconds, no Z)
function isoToLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local) {
  if (!local) return null;
  // datetime-local strings have no timezone; treat as local time
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function BloodsModal({ onCancel, onSubmit }) {
  const nowIso = new Date().toISOString();
  const [sampleTakenAt, setSampleTakenAt] = useState(isoToLocalInput(nowIso));
  const [resultsAvailableAt, setResultsAvailableAt] = useState("");
  const [panels, setPanels] = useState(emptyPanelValues);

  const updatePanelField = (panelKey, fieldKey, value) => {
    setPanels((prev) => ({
      ...prev,
      [panelKey]: { ...prev[panelKey], [fieldKey]: value },
    }));
  };

  const handleSubmit = () => {
    // Validate at least one field is populated (otherwise empty entry)
    const allPanels = [...PANELS.map((p) => p.key), "bloodGas"];
    const anyValue = allPanels.some((pk) =>
      Object.entries(panels[pk] || {}).some(
        ([k, v]) => k !== "type" && v && String(v).trim() !== ""
      )
    );

    if (!anyValue) {
      alert("Please enter at least one result before saving.");
      return;
    }

    onSubmit({
      sampleTakenAt: localInputToIso(sampleTakenAt) || nowIso,
      resultsAvailableAt: localInputToIso(resultsAvailableAt),
      panels,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-card modal-card-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-header">
          <h2>Add bloods result</h2>
          <button onClick={onCancel}>Close</button>
        </div>

        <p className="confirm-tagline">
          Enter only the results you have. Empty fields are skipped.
          Both timestamps are editable — sample time defaults to now,
          results time can be left blank if not yet returned.
        </p>

        <div className="bloods-meta">
          <label>
            Sample taken at
            <input
              type="datetime-local"
              value={sampleTakenAt}
              onChange={(e) => setSampleTakenAt(e.target.value)}
            />
          </label>
          <label>
            Results available at <span className="optional">(optional)</span>
            <input
              type="datetime-local"
              value={resultsAvailableAt}
              onChange={(e) => setResultsAvailableAt(e.target.value)}
            />
          </label>
        </div>

        <div className="bloods-panels">
          {PANELS.map((p) => (
            <div key={p.key} className="bloods-panel">
              <h4 className="bloods-panel-title">{p.label}</h4>
              <div className="bloods-panel-fields">
                {p.fields.map((f) => (
                  <label key={f.key} className="bloods-field">
                    <span>{f.label}</span>
                    <input
                      type="text"
                      value={panels[p.key][f.key]}
                      onChange={(e) =>
                        updatePanelField(p.key, f.key, e.target.value)
                      }
                      inputMode="decimal"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Blood gas — special: includes a type selector */}
          <div className="bloods-panel bloods-panel-gas">
            <h4 className="bloods-panel-title">Blood gas</h4>
            <div className="bloods-gas-type">
              <span className="bloods-gas-type-label">Type:</span>
              {GAS_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`gas-type-btn ${
                    panels.bloodGas.type === t ? "active" : ""
                  }`}
                  onClick={() =>
                    setPanels((prev) => ({
                      ...prev,
                      bloodGas: {
                        ...prev.bloodGas,
                        type: prev.bloodGas.type === t ? null : t,
                      },
                    }))
                  }
                  title={
                    t === "VBG"
                      ? "Venous blood gas"
                      : t === "ABG"
                      ? "Arterial blood gas"
                      : "Capillary blood gas"
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="bloods-panel-fields">
              {GAS_FIELDS.map((f) => (
                <label key={f.key} className="bloods-field">
                  <span>{f.label}</span>
                  <input
                    type="text"
                    value={panels.bloodGas[f.key]}
                    onChange={(e) =>
                      setPanels((prev) => ({
                        ...prev,
                        bloodGas: {
                          ...prev.bloodGas,
                          [f.key]: e.target.value,
                        },
                      }))
                    }
                    inputMode="decimal"
                    disabled={!panels.bloodGas.type}
                  />
                </label>
              ))}
            </div>
            {!panels.bloodGas.type && (
              <p className="bloods-gas-hint">
                Select VBG / ABG / CBG above to enable gas fields.
              </p>
            )}
          </div>
        </div>

        <div className="discharge-actions">
          <button className="ghost-btn-dark" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSubmit}>
            Save bloods (sign)
          </button>
        </div>
      </div>
    </div>
  );
}

export default BloodsModal;