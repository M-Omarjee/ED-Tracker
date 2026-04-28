import { timeInDeptMs } from "../lib/time";

function formatMinutesAsTime(mins) {
  if (mins === null || mins === undefined || Number.isNaN(mins)) return "—";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function StatsBanner({ patients, nowTick }) {
  const total = patients.length;

  const validDurations = patients
    .map((p) => timeInDeptMs(p, nowTick))
    .filter((ms) => ms !== null && ms > 0);

  const avgMins =
    validDurations.length === 0
      ? null
      : validDurations.reduce((a, b) => a + b, 0) /
        validDurations.length /
        60000;

  const highAcuity = patients.filter(
    (p) =>
      p.triage === "Red" ||
      (typeof p.newsScore === "number" ? p.newsScore : Number(p.newsScore)) >=
        5
  ).length;

  return (
    <div className="stats-banner">
      <div className="stat-card">
        <div className="stat-value">{total}</div>
        <div className="stat-label">
          {total === 1 ? "Patient in dept" : "Patients in dept"}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{formatMinutesAsTime(avgMins)}</div>
        <div className="stat-label">Avg time in dept</div>
      </div>
      <div className="stat-card stat-card-alert">
        <div className="stat-value">{highAcuity}</div>
        <div className="stat-label">High acuity (Red / NEWS ≥5)</div>
      </div>
    </div>
  );
}

export default StatsBanner;