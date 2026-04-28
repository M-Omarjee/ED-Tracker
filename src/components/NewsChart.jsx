import { calculateNews2, newsRiskBand } from "../lib/news";
import { useMemo } from "react";

function NewsChart({
  patient,
  newNews,
  setNewNews,
  onAddNewsEntry,
  onSetScale,
}) {
  const activeScale = patient?.news2Scale || "scale1";
  const liveNews = useMemo(
    () => calculateNews2(newNews, activeScale),
    [newNews, activeScale]
  );

  return (
    <div className="news-card">
      <div className="news-header">
        <h3>NEWS chart</h3>
        <div
          className="scale-toggle"
          role="group"
          aria-label="NEWS2 SpO2 scale"
        >
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

      <table className="news-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>RR</th>
            <th>SpO₂</th>
            <th>O₂</th>
            <th>Temp</th>
            <th>SBP</th>
            <th>HR</th>
            <th>AVPU</th>
            <th>NEWS</th>
          </tr>
        </thead>
        <tbody>
          {(patient.newsHistory || []).map((entry, index) => (
            <tr key={index}>
              <td>{entry.time}</td>
              <td>{entry.rr}</td>
              <td>{entry.spo2}</td>
              <td>{entry.o2}</td>
              <td>{entry.temp}</td>
              <td>{entry.sbp}</td>
              <td>{entry.hr}</td>
              <td>{entry.avpu}</td>
              <td>{entry.score}</td>
            </tr>
          ))}
          {(!patient.newsHistory || patient.newsHistory.length === 0) && (
            <tr>
              <td colSpan="9" style={{ textAlign: "center", color: "#666" }}>
                No NEWS entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h4 style={{ marginTop: "12px" }}>Add new NEWS entry</h4>
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
  );
}

export default NewsChart;