import { useState } from "react";

const PANEL_LABELS = {
  fbc: "FBC",
  ues: "U&Es",
  lfts: "LFTs",
  inflammatory: "Inflammatory",
  otherMarkers: "Other",
  bloodGas: "Blood gas",
};

const FIELD_LABELS = {
  // FBC
  hb: "Hb",
  wbc: "WBC",
  plt: "Plt",
  neut: "Neut",
  lymph: "Lymph",
  // U&Es
  na: "Na",
  k: "K",
  urea: "Urea",
  creatinine: "Creat",
  egfr: "eGFR",
  // LFTs
  bili: "Bili",
  alt: "ALT",
  alp: "ALP",
  albumin: "Albumin",
  // Inflammatory
  crp: "CRP",
  // Other
  lactate: "Lactate",
  troponin: "Trop",
  bnp: "BNP",
  ddimer: "D-dimer",
  // Gas
  ph: "pH",
  pco2: "pCO₂",
  po2: "pO₂",
  hco3: "HCO₃",
  be: "BE",
  glucose: "Gluc",
};

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function summariseEntry(entry) {
  const out = [];
  Object.entries(entry.panels || {}).forEach(([panelKey, values]) => {
    const filled = Object.entries(values).filter(
      ([k, v]) => k !== "type" && v && String(v).trim() !== ""
    );
    if (filled.length === 0) return;
    const summary = filled
      .map(([k, v]) => `${FIELD_LABELS[k] || k} ${v}`)
      .join(", ");
    const label =
      panelKey === "bloodGas" && values.type
        ? `${values.type}`
        : PANEL_LABELS[panelKey] || panelKey;
    out.push({ panelKey, label, summary });
  });
  return out;
}

function BloodsHistory({ bloodResults }) {
  const [activeEntry, setActiveEntry] = useState(null);
  const list = bloodResults || [];

  if (list.length === 0) {
    return (
      <div className="bloods-history">
        <strong>Bloods history:</strong>
        <p className="notes-empty">No bloods recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bloods-history">
      <strong>Bloods history:</strong>
      <ul className="bloods-list">
        {[...list]
          .sort(
            (a, b) =>
              new Date(b.sampleTakenAt).getTime() -
              new Date(a.sampleTakenAt).getTime()
          )
          .map((entry) => {
            const summaries = summariseEntry(entry);
            return (
              <li
                key={entry.id}
                className="bloods-entry-card"
                onClick={() => setActiveEntry(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveEntry(entry);
                  }
                }}
              >
                <div className="bloods-entry-header">
                  <span className="bloods-entry-time">
                    Sample: {formatDateTime(entry.sampleTakenAt)}
                  </span>
                  {entry.resultsAvailableAt && (
                    <span className="bloods-entry-results">
                      Results: {formatDateTime(entry.resultsAvailableAt)}
                    </span>
                  )}
                  {entry.authorName && (
                    <span className="note-author-pill">
                      {entry.authorName}
                      {entry.authorRole && (
                        <span className="note-author-pill-role">
                          {entry.authorRole}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="bloods-entry-summary">
                  {summaries.length === 0 && (
                    <span className="notes-empty">No values recorded</span>
                  )}
                  {summaries.map((s) => (
                    <div key={s.panelKey} className="bloods-summary-row">
                      <span className="bloods-summary-label">{s.label}:</span>
                      <span className="bloods-summary-values">
                        {s.summary}
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
      </ul>

      {activeEntry && (
        <BloodsDetailModal
          entry={activeEntry}
          onClose={() => setActiveEntry(null)}
        />
      )}
    </div>
  );
}

function BloodsDetailModal({ entry, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 700 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-header">
          <h2>Bloods entry</h2>
          <button onClick={onClose}>Close</button>
        </div>

        <div className="note-meta">
          <div className="note-meta-row">
            <span className="note-meta-label">Sample taken</span>
            <span className="note-meta-value">
              {formatDateTime(entry.sampleTakenAt)}
            </span>
          </div>
          <div className="note-meta-row">
            <span className="note-meta-label">Results available</span>
            <span className="note-meta-value">
              {entry.resultsAvailableAt
                ? formatDateTime(entry.resultsAvailableAt)
                : "Not yet recorded"}
            </span>
          </div>
          {entry.authorName ? (
            <>
              <div className="note-meta-row">
                <span className="note-meta-label">Recorded by</span>
                <span className="note-meta-value">{entry.authorName}</span>
              </div>
              <div className="note-meta-row">
                <span className="note-meta-label">Role</span>
                <span className="note-meta-value">{entry.authorRole}</span>
              </div>
            </>
          ) : (
            <div className="note-meta-row">
              <span className="note-meta-label">Recorded by</span>
              <span className="note-meta-value note-meta-legacy">
                Unsigned (legacy entry)
              </span>
            </div>
          )}
        </div>

        <div className="bloods-detail-panels">
          {Object.entries(entry.panels || {}).map(([panelKey, values]) => {
            const filled = Object.entries(values).filter(
              ([k, v]) => k !== "type" && v && String(v).trim() !== ""
            );
            if (filled.length === 0) return null;
            const heading =
              panelKey === "bloodGas" && values.type
                ? `Blood gas (${values.type})`
                : PANEL_LABELS[panelKey] || panelKey;
            return (
              <div key={panelKey} className="bloods-detail-panel">
                <div className="bloods-detail-panel-title">{heading}</div>
                <div className="bloods-detail-grid">
                  {filled.map(([k, v]) => (
                    <div key={k} className="bloods-detail-cell">
                      <span className="bloods-detail-label">
                        {FIELD_LABELS[k] || k}
                      </span>
                      <span className="bloods-detail-value">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="note-locked-banner">
          🔒 This entry is locked. Once submitted, blood results cannot
          be edited or deleted.
        </div>
      </div>
    </div>
  );
}

export default BloodsHistory;