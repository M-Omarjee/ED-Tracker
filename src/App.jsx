import { useState } from "react";
import "./App.css";

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

const initialPatients = [
  {
    id: 1,
    patientId: "H123456",
    name: "John Smith",
    address: "24 Green Street, London E1 6AA",
    gpName: "Dr Patel",
    gpPractice: "Whitechapel Health Centre",
    gpPhone: "0207 123 4567",

    timeInDept: "3:57",
    triage: "Red",
    referral: "Medics",
    phone: "07123 456789",
    emergencyContact: "Jane Smith",
    presentingComplaint: "Central chest pain",
    status: "Waiting medical review",

    newsScore: 4,
    newsHistory: [
      {
        time: "13:40",
        rr: "22",
        spo2: "95",
        o2: "Air",
        temp: "37.5",
        sbp: "110",
        hr: "104",
        avpu: "A",
        score: "4",
      },
    ],

    notes: [],
  },
  {
    id: 2,
    patientId: "H987654",
    name: "Sarah Ahmed",
    address: "12 Oak Avenue, London N1 4QR",
    gpName: "Dr Williams",
    gpPractice: "North Road Medical Centre",
    gpPhone: "0208 222 1133",

    timeInDept: "2:10",
    triage: "Amber",
    referral: "Surgeons",
    phone: "07111 222333",
    emergencyContact: "Mother",
    presentingComplaint: "RIF pain",
    status: "Waiting surgical review",

    newsScore: 2,
    newsHistory: [
      {
        time: "13:50",
        rr: "18",
        spo2: "98",
        o2: "Air",
        temp: "36.9",
        sbp: "120",
        hr: "88",
        avpu: "A",
        score: "2",
      },
    ],

    notes: [],
  },
];

function App() {
  const [patients, setPatients] = useState(initialPatients);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const [note, setNote] = useState("");
  const [tasks, setTasks] = useState({
    triage: false,
    bloods: false,
    imaging: false,
    referral: false,
  });
  const [imagingText, setImagingText] = useState("");
  const [referral, setReferral] = useState(referralOptions[0]);

  const [showNewsChart, setShowNewsChart] = useState(false);
  const [newNews, setNewNews] = useState({
    time: "",
    rr: "",
    spo2: "",
    o2: "",
    temp: "",
    sbp: "",
    hr: "",
    avpu: "",
    score: "",
  });

  const selectedPatient =
    patients.find((p) => p.id === selectedPatientId) || null;

  const handleRowClick = (id) => {
    setSelectedPatientId(id);
    setNote("");
    setTasks({
      triage: false,
      bloods: false,
      imaging: false,
      referral: false,
    });
    setImagingText("");
    setReferral(referralOptions[0]);
    setShowNewsChart(false);
    setNewNews({
      time: "",
      rr: "",
      spo2: "",
      o2: "",
      temp: "",
      sbp: "",
      hr: "",
      avpu: "",
      score: "",
    });
  };

  const toggleTask = (name) => {
    setTasks((prev) => {
      // if already done, do nothing
      if (prev[name]) return prev;
      // otherwise mark as done
      return { ...prev, [name]: true };
    });
  };
  

  const handleDischarge = () => {
    if (!selectedPatientId) return;
    setPatients((prev) => prev.filter((p) => p.id !== selectedPatientId));
    setSelectedPatientId(null);
  };

  const handleSubmitNote = () => {
    if (!note.trim() || !selectedPatientId) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newNote = {
      time: timestamp,
      text: note.trim(),
    };

    const updatedPatients = patients.map((p) =>
      p.id === selectedPatientId ? { ...p, notes: [...p.notes, newNote] } : p
    );

    setPatients(updatedPatients);
    setNote("");
  };

  const handleAddNewsEntry = () => {
    if (!selectedPatientId) return;

    const timestamp =
      newNews.time ||
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

    const entry = {
      time: timestamp,
      rr: newNews.rr,
      spo2: newNews.spo2,
      o2: newNews.o2,
      temp: newNews.temp,
      sbp: newNews.sbp,
      hr: newNews.hr,
      avpu: newNews.avpu,
      score: newNews.score,
    };

    const updatedPatients = patients.map((p) =>
      p.id === selectedPatientId
        ? {
            ...p,
            newsHistory: [...(p.newsHistory || []), entry],
            newsScore: entry.score || p.newsScore,
          }
        : p
    );

    setPatients(updatedPatients);

    setNewNews({
      time: "",
      rr: "",
      spo2: "",
      o2: "",
      temp: "",
      sbp: "",
      hr: "",
      avpu: "",
      score: "",
    });
  };

  return (
    <div className="app">
      <header className="top-bar">
        <h1>ED Tracker</h1>
        <button
          className="primary-btn"
          onClick={() => alert("Add Patient form coming soon")}
        >
          Add Patient
        </button>
      </header>

      <div className="content">
        {/* Patients table */}
        <div className="table-card">
          <h2>Patients in department</h2>
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Presenting complaint</th>
                <th>Time in dept</th>
                <th>Triage</th>
                <th>NEWS</th>
                <th>Referral</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} onClick={() => handleRowClick(p.id)}>
                  <td>{p.name}</td>
                  <td>{p.presentingComplaint}</td>
                  <td>{p.timeInDept}</td>
                  <td>
                    <span
                      className={`triage-dot triage-${p.triage.toLowerCase()}`}
                    />
                    {p.triage}
                  </td>
                  <td>{p.newsScore}</td>
                  <td>{p.referral}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No patients – all seen!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected patient panel */}
        {selectedPatient && (
          <div className="detail-card">
            <div className="detail-header">
              <h2>{selectedPatient.name}</h2>
              <button onClick={() => setSelectedPatientId(null)}>Close</button>
            </div>

            <div className="contact-banner">
  <div><strong>Patient ID:</strong> {selectedPatient.patientId}</div>
  <div><strong>Address:</strong> {selectedPatient.address}</div>
  <div><strong>Phone:</strong> {selectedPatient.phone}</div>
  <div><strong>Emergency Contact:</strong> {selectedPatient.emergencyContact}</div>
  <div>
    <strong>GP:</strong> {selectedPatient.gpName} ({selectedPatient.gpPractice}) – {selectedPatient.gpPhone}
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
              onClick={handleSubmitNote}
            >
              Submit Note
            </button>

            <div className="tasks">
              <label>
                <input
                  type="checkbox"
                  checked={tasks.triage}
                  disabled={tasks.triage}
                  onChange={() => toggleTask("triage")}
                />
                Triage
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={tasks.bloods}
                  disabled={tasks.bloods}
                  onChange={() => toggleTask("bloods")}
                />
                Bloods
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={tasks.imaging}
                  disabled={tasks.imaging}
                  onChange={() => toggleTask("imaging")}
                />
                Imaging
              </label>
              <input
                type="text"
                className="imaging-input"
                value={imagingText}
                onChange={(e) => setImagingText(e.target.value)}
                placeholder="state imaging (e.g. CXR, CT head)"
              />
              <label>
                <input
                  type="checkbox"
                  checked={tasks.referral}
                  disabled={tasks.referral}
                  onChange={() => toggleTask("referral")}
                />
                Referral
              </label>
              <select
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
              >
                {referralOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: "16px" }}>
              <strong>Notes History:</strong>
              {selectedPatient.notes.length === 0 && (
                <p style={{ color: "#666" }}>No notes yet.</p>
              )}
              <ul style={{ paddingLeft: "16px" }}>
                {selectedPatient.notes.map((n, index) => (
                  <li key={index} style={{ marginBottom: "6px" }}>
                    <strong>{n.time}:</strong> {n.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="news-section">
              <strong>NEWS:</strong> {selectedPatient.newsScore}
              <button
                className="link-btn"
                onClick={() => setShowNewsChart((prev) => !prev)}
              >
                {showNewsChart ? "Hide chart" : "View chart"}
              </button>
            </div>

            {showNewsChart && (
              <div className="news-card">
                <h3>NEWS chart</h3>

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
                    {(selectedPatient.newsHistory || []).map(
                      (entry, index) => (
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
                      )
                    )}
                    {(!selectedPatient.newsHistory ||
                      selectedPatient.newsHistory.length === 0) && (
                      <tr>
                        <td
                          colSpan="9"
                          style={{ textAlign: "center", color: "#666" }}
                        >
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
                    NEWS
                    <input
                      type="number"
                      value={newNews.score}
                      onChange={(e) =>
                        setNewNews((n) => ({ ...n, score: e.target.value }))
                      }
                    />
                  </label>
                </div>

                <button
                  className="primary-btn"
                  style={{ marginTop: "8px" }}
                  onClick={handleAddNewsEntry}
                >
                  Save NEWS entry
                </button>
              </div>
            )}

            <button
              className="primary-btn full-width"
              onClick={handleDischarge}
            >
              Discharge Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
