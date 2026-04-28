import { useState, useMemo } from "react";
import { calculateNews2, newsRiskBand } from "../lib/news";

const TABS = [
  { key: "entry", label: "Add entry" },
  { key: "reference", label: "Reference grid" },
  { key: "trend", label: "Trend" },
];

// RCP NEWS2 reference scoring bands (Scale 1).
// Each row = parameter, each cell = display label + score.
// Used both for the visual reference grid and to highlight which bands
// triggered for the most recent observation.
const REFERENCE_ROWS_SCALE_1 = [
  {
    key: "rr",
    label: "Respiration rate (per min)",
    cells: [
      { range: "≤8", score: 3 },
      { range: "9-11", score: 1 },
      { range: "12-20", score: 0 },
      { range: "—", score: 0, hidden: true },
      { range: "21-24", score: 2 },
      { range: "≥25", score: 3 },
    ],
  },
  {
    key: "spo2",
    label: "SpO₂ Scale 1 (%)",
    cells: [
      { range: "≤91", score: 3 },
      { range: "92-93", score: 2 },
      { range: "94-95", score: 1 },
      { range: "≥96", score: 0 },
      { range: "—", score: 0, hidden: true },
      { range: "—", score: 0, hidden: true },
    ],
  },
  {
    key: "o2",
    label: "Air or oxygen?",
    cells: [
      { range: "—", score: 0, hidden: true },
      { range: "Oxygen", score: 2 },
      { range: "—", score: 0, hidden: true },
      { range: "Air", score: 0 },
      { range: "—", score: 0, hidden: true },
      { range: "—", score: 0, hidden: true },
    ],
  },
  {
    key: "temp",
    label: "Temperature (°C)",
    cells: [
      { range: "≤35.0", score: 3 },
      { range: "—", score: 0, hidden: true },
      { range: "35.1-36.0", score: 1 },
      { range: "36.1-38.0", score: 0 },
      { range: "38.1-39.0", score: 1 },
      { range: "≥39.1", score: 2 },
    ],
  },
  {
    key: "sbp",
    label: "Systolic BP (mmHg)",
    cells: [
      { range: "≤90", score: 3 },
      { range: "91-100", score: 2 },
      { range: "101-110", score: 1 },
      { range: "111-219", score: 0 },
      { range: "—", score: 0, hidden: true },
      { range: "≥220", score: 3 },
    ],
  },
  {
    key: "hr",
    label: "Heart rate (per min)",
    cells: [
      { range: "≤40", score: 3 },
      { range: "—", score: 0, hidden: true },
      { range: "41-50", score: 1 },
      { range: "51-90", score: 0 },
      { range: "91-110", score: 1 },
      { range: "111-130, ≥131", score: 2 },
    ],
  },
  {
    key: "avpu",
    label: "Consciousness",
    cells: [
      { range: "—", score: 0, hidden: true },
      { range: "—", score: 0, hidden: true },
      { range: "—", score: 0, hidden: true },
      { range: "Alert", score: 0 },
      { range: "—", score: 0, hidden: true },
      { range: "V/P/U", score: 3 },
    ],
  },
];

const REFERENCE_ROWS_SCALE_2 = [
  REFERENCE_ROWS_SCALE_1[0], // RR
  {
    key: "spo2",
    label: "SpO₂ Scale 2 (%)",
    cells: [
      { range: "≤83", score: 3 },
      { range: "84-85", score: 2 },
      { range: "86-87", score: 1 },
      { range: "88-92 (any), 93-94 air", score: 0 },
      { range: "93-94 O₂", score: 1 },
      { range: "95-96 O₂, ≥97 O₂", score: 2 },
    ],
  },
  ...REFERENCE_ROWS_SCALE_1.slice(2),
];

// Determine which cell index (0-5) the patient's value falls into,
// for highlighting in the reference grid.
function findCellIndex(rowKey, value, scale, allObs) {
  if (rowKey === "rr") {
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    if (v <= 8) return 0;
    if (v <= 11) return 1;
    if (v <= 20) return 2;
    if (v <= 24) return 4;
    return 5;
  }
  if (rowKey === "spo2") {
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    if (scale === "scale2") {
      const onO2 =
        allObs.o2 &&
        String(allObs.o2).trim().toLowerCase() !== "" &&
        String(allObs.o2).trim().toLowerCase() !== "air";
      if (v <= 83) return 0;
      if (v <= 85) return 1;
      if (v <= 87) return 2;
      if (v <= 92) return 3;
      if (!onO2) return 3;
      if (v <= 94) return 4;
      return 5;
    }
    if (v <= 91) return 0;
    if (v <= 93) return 1;
    if (v <= 95) return 2;
    return 3;
  }
  if (rowKey === "o2") {
    if (!value) return null;
    const lower = String(value).trim().toLowerCase();
    if (lower === "" || lower === "air") return 3;
    return 1;
  }
  if (rowKey === "temp") {
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    if (v <= 35) return 0;
    if (v <= 36) return 2;
    if (v <= 38) return 3;
    if (v <= 39) return 4;
    return 5;
  }
  if (rowKey === "sbp") {
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    if (v <= 90) return 0;
    if (v <= 100) return 1;
    if (v <= 110) return 2;
    if (v <= 219) return 3;
    return 5;
  }
  if (rowKey === "hr") {
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    if (v <= 40) return 0;
    if (v <= 50) return 2;
    if (v <= 90) return 3;
    if (v <= 110) return 4;
    return 5;
  }
  if (rowKey === "avpu") {
    if (!value) return null;
    const v = String(value).trim().toUpperCase();
    if (v === "A") return 3;
    if (v === "V" || v === "P" || v === "U") return 5;
    return null;
  }
  return null;
}

function scoreColourClass(score) {
  if (score === 0) return "ref-cell-0";
  if (score === 1) return "ref-cell-1";
  if (score === 2) return "ref-cell-2";
  return "ref-cell-3";
}

// Trend chart traffic-light cell colour, matches scoreColourClass
function trendCellColour(score) {
  return scoreColourClass(Number(score));
}

function ReferenceGrid({ scale, highlightObs }) {
  const rows =
    scale === "scale2" ? REFERENCE_ROWS_SCALE_2 : REFERENCE_ROWS_SCALE_1;

  return (
    <div className="reference-wrap">
      <table className="reference-grid">
        <thead>
          <tr>
            <th>Parameter</th>
            <th colSpan={3}>Lower</th>
            <th>Normal</th>
            <th colSpan={2}>Upper</th>
          </tr>
          <tr className="reference-score-header">
            <th></th>
            <th className="ref-cell-3">+3</th>
            <th className="ref-cell-2">+2</th>
            <th className="ref-cell-1">+1</th>
            <th className="ref-cell-0">0</th>
            <th className="ref-cell-1">+1</th>
            <th className="ref-cell-2-3">+2 / +3</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const highlightIdx = highlightObs
              ? findCellIndex(row.key, highlightObs[row.key], scale, highlightObs)
              : null;
            return (
              <tr key={row.key}>
                <td className="ref-row-label">{row.label}</td>
                {row.cells.map((c, idx) => (
                  <td
                    key={idx}
                    className={`${scoreColourClass(c.score)} ${
                      idx === highlightIdx ? "ref-cell-highlight" : ""
                    } ${c.hidden ? "ref-cell-empty" : ""}`}
                    title={
                      idx === highlightIdx
                        ? `Triggered by latest obs (+${c.score})`
                        : undefined
                    }
                  >
                    {c.hidden ? "" : c.range}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {highlightObs && (
        <p className="reference-caption">
          Cells with a teal border show which bands the latest observation
          triggered.
        </p>
      )}
    </div>
  );
}

function TrendView({ history, scale }) {
  if (!history || history.length === 0) {
    return (
      <p className="notes-empty">
        No NEWS entries yet — add one to see the trend.
      </p>
    );
  }

  // Sort chronologically (oldest left)
  const ordered = [...history].sort((a, b) => {
    const ka = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const kb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ka - kb;
  });

  const rowDefs = [
    { key: "rr", label: "RR" },
    { key: "spo2", label: "SpO₂" },
    { key: "o2", label: "O₂" },
    { key: "temp", label: "Temp" },
    { key: "sbp", label: "SBP" },
    { key: "hr", label: "HR" },
    { key: "avpu", label: "AVPU" },
    { key: "score", label: "NEWS" },
  ];

  return (
    <div className="trend-wrap">
      <table className="trend-grid">
        <thead>
          <tr>
            <th></th>
            {ordered.map((entry, idx) => (
              <th key={idx} className="trend-time">
                {entry.time}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowDefs.map((row) => (
            <tr key={row.key}>
              <td className="trend-row-label">{row.label}</td>
              {ordered.map((entry, idx) => {
                const value = entry[row.key];
                if (row.key === "score") {
                  const score = Number(value);
                  const cls = trendCellColour(score);
                  return (
                    <td key={idx} className={`trend-cell trend-cell-score ${cls}`}>
                      {value || "—"}
                    </td>
                  );
                }
                // For data rows, traffic-light per-cell using calculateNews2
                const partial = { ...entry };
                const calc = calculateNews2(partial, scale);
                const subscore = calc.breakdown[row.key];
                const cls = subscore == null ? "" : trendCellColour(subscore);
                return (
                  <td key={idx} className={`trend-cell ${cls}`}>
                    {value || "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="reference-caption">
        Traffic-light colours match RCP NEWS2 score bands (white = 0, yellow = 1,
        orange = 2, red = 3).
      </p>
    </div>
  );
}

function NewsChart({
  patient,
  newNews,
  setNewNews,
  onAddNewsEntry,
  onSetScale,
}) {
  const activeScale = patient?.news2Scale || "scale1";
  const [tab, setTab] = useState("entry");

  const liveNews = useMemo(
    () => calculateNews2(newNews, activeScale),
    [newNews, activeScale]
  );

  // Latest recorded obs (for the reference-grid highlights)
  const latestObs = useMemo(() => {
    const hist = patient.newsHistory || [];
    if (hist.length === 0) return null;
    const sorted = [...hist].sort((a, b) => {
      const ka = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const kb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return kb - ka;
    });
    return sorted[0];
  }, [patient.newsHistory]);

  return (
    <div className="news-card">
      <div className="news-header">
        <h3>NEWS chart</h3>
        <div className="scale-toggle" role="group" aria-label="NEWS2 SpO2 scale">
          <button
            type="button"
            className={`scale-btn ${activeScale === "scale1" ? "active" : ""}`}
            onClick={() => onSetScale("scale1")}
            title="Standard adult scale (target SpO2 ≥96%)"
          >
            Scale 1
          </button>
          <button
            type="button"
            className={`scale-btn ${activeScale === "scale2" ? "active" : ""}`}
            onClick={() => onSetScale("scale2")}
            title="Hypercapnic respiratory failure (target SpO2 88-92%)"
          >
            Scale 2
          </button>
        </div>
      </div>

      <div className="news-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`news-tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "entry" && (
        <div className="news-tab-panel">
          <h4 style={{ marginTop: "8px" }}>Add new NEWS entry</h4>
          <div className="news-form">
            <label>
              RR
              <input
                type="number"
                value={newNews.rr}
                onChange={(e) =>
                  setNewNews((n) => ({ ...n, rr: e.target.value }))
                }
              />
            </label>
            <label>
              SpO₂
              <input
                type="number"
                value={newNews.spo2}
                onChange={(e) =>
                  setNewNews((n) => ({ ...n, spo2: e.target.value }))
                }
              />
            </label>
            <label>
              O₂
              <input
                type="text"
                placeholder="Air / 2L NC…"
                value={newNews.o2}
                onChange={(e) =>
                  setNewNews((n) => ({ ...n, o2: e.target.value }))
                }
              />
            </label>
            <label>
              Temp
              <input
                type="number"
                step="0.1"
                value={newNews.temp}
                onChange={(e) =>
                  setNewNews((n) => ({ ...n, temp: e.target.value }))
                }
              />
            </label>
            <label>
              SBP
              <input
                type="number"
                value={newNews.sbp}
                onChange={(e) =>
                  setNewNews((n) => ({ ...n, sbp: e.target.value }))
                }
              />
            </label>
            <label>
              HR
              <input
                type="number"
                value={newNews.hr}
                onChange={(e) =>
                  setNewNews((n) => ({ ...n, hr: e.target.value }))
                }
              />
            </label>
            <label>
              AVPU
              <input
                type="text"
                placeholder="A / V / P / U"
                value={newNews.avpu}
                onChange={(e) =>
                  setNewNews((n) => ({ ...n, avpu: e.target.value }))
                }
              />
            </label>
            <label>
              NEWS (auto, {activeScale === "scale2" ? "Scale 2" : "Scale 1"})
              <div
                className={`news-auto news-band-${newsRiskBand(liveNews.total)}`}
              >
                {liveNews.total === null ? "—" : liveNews.total}
              </div>
            </label>
          </div>

          <button
            className="primary-btn"
            style={{ marginTop: "8px" }}
            onClick={() => onAddNewsEntry(liveNews)}
          >
            Save NEWS entry
          </button>
        </div>
      )}

      {tab === "reference" && (
        <div className="news-tab-panel">
          <ReferenceGrid scale={activeScale} highlightObs={latestObs} />
        </div>
      )}

      {tab === "trend" && (
        <div className="news-tab-panel">
          <TrendView history={patient.newsHistory} scale={activeScale} />
        </div>
      )}
    </div>
  );
}

export default NewsChart;