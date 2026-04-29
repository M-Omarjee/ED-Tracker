import { useState, useMemo } from "react";
import { calculateNews2, newsRiskBand } from "../lib/news";

const TABS = [
  { key: "entry", label: "Add entry" },
  { key: "trend", label: "Trend" },
];

function scoreColourClass(score) {
  if (score === 0) return "ref-cell-0";
  if (score === 1) return "ref-cell-1";
  if (score === 2) return "ref-cell-2";
  return "ref-cell-3";
}

function trendCellColour(score) {
  return scoreColourClass(Number(score));
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

      {tab === "trend" && (
        <div className="news-tab-panel">
          <TrendView history={patient.newsHistory} scale={activeScale} />
        </div>
      )}
    </div>
  );
}

export default NewsChart;