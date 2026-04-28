import { useState } from "react";
import NewsChart from "./NewsChart";

const referralOptions = [
  "Medics",
  "Surgeons",
  "Paeds",
  "Gynae",
  "Ortho",
  "ENT",
  "ICU",
  "Anaesthetics",
  "Psych",
];

function PatientDetail({
  patient,
  note,
  setNote,
  newNews,
  setNewNews,
  onClose,
  onSubmitNote,
  onToggleTask,
  onUpdateImagingText,
  onUpdateReferralChoice,
  onSetNews2Scale,
  onAddNewsEntry,
  onDischarge,
}) {
  const [showNewsChart, setShowNewsChart] = useState(false);

  return (
    <div className="detail-card">
      <div className="detail-header">
        <h2>{patient.name}</h2>
        <button onClick={onClose}>Close</button>
      </div>

      <div className="contact-banner">
        <div>
          <strong>Patient ID:</strong> {patient.patientId}
        </div>
        <div>
          <strong>Address:</strong> {patient.address || "—"}
        </div>
        <div>
          <strong>Phone:</strong> {patient.phone || "—"}
        </div>
        <div>
          <strong>Emergency Contact:</strong>{" "}
          {patient.emergencyContact || "—"}
        </div>
        <div>
          <strong>GP:</strong>{" "}
          {patient.gpName
            ? `${patient.gpName} (${patient.gpPractice}) – ${patient.gpPhone}`
            : "—"}
        </div>
      </div>

      <label className="block-label">
        Free text to document
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Clerking, plan, handover notes…"
        />
      </label>

      <button
        className="primary-btn"
        style={{ marginTop: "8px" }}
        onClick={onSubmitNote}
      >
        Submit Note
      </button>

      <div className="tasks">
        <label>
          <input
            type="checkbox"
            checked={!!patient.tasks?.triage}
            disabled={!!patient.tasks?.triage}
            onChange={() => onToggleTask("triage")}
          />
          Triage
        </label>
        <label>
          <input
            type="checkbox"
            checked={!!patient.tasks?.bloods}
            disabled={!!patient.tasks?.bloods}
            onChange={() => onToggleTask("bloods")}
          />
          Bloods
        </label>
        <label>
          <input
            type="checkbox"
            checked={!!patient.tasks?.imaging}
            disabled={!!patient.tasks?.imaging}
            onChange={() => onToggleTask("imaging")}
          />
          Imaging
        </label>
        <input
          type="text"
          className="imaging-input"
          value={patient.imagingText || ""}
          onChange={(e) => onUpdateImagingText(e.target.value)}
          placeholder="state imaging (e.g. CXR, CT head)"
        />
        <label>
          <input
            type="checkbox"
            checked={!!patient.tasks?.referral}
            disabled={!!patient.tasks?.referral}
            onChange={() => onToggleTask("referral")}
          />
          Referral
        </label>
        <select
          value={patient.referralChoice || referralOptions[0]}
          onChange={(e) => onUpdateReferralChoice(e.target.value)}
        >
          {referralOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: "16px" }}>
        <strong>Notes History:</strong>
        {(!patient.notes || patient.notes.length === 0) && (
          <p style={{ color: "#666" }}>No notes yet.</p>
        )}
        <ul style={{ paddingLeft: "16px" }}>
          {(patient.notes || []).map((n, index) => (
            <li key={index} style={{ marginBottom: "6px" }}>
              <strong>{n.time}:</strong> {n.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="news-section">
        <strong>NEWS:</strong> {patient.newsScore}
        <button
          className="link-btn"
          onClick={() => setShowNewsChart((prev) => !prev)}
        >
          {showNewsChart ? "Hide chart" : "View chart"}
        </button>
      </div>

      {showNewsChart && (
        <NewsChart
          patient={patient}
          newNews={newNews}
          setNewNews={setNewNews}
          onAddNewsEntry={onAddNewsEntry}
          onSetScale={onSetNews2Scale}
        />
      )}

      <button className="primary-btn full-width" onClick={onDischarge}>
        Discharge Home
      </button>
    </div>
  );
}

export default PatientDetail;