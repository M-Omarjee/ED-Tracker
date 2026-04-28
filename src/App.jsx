import { useState, useEffect, useMemo } from "react";
import { calculateNews2, newsRiskBand } from "./lib/news";
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

const triageOptions = ["Red", "Amber", "Green"];

const emptyTasks = {
  triage: false,
  bloods: false,
  imaging: false,
  referral: false,
};

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
    tasks: { ...emptyTasks },
    imagingText: "",
    referralChoice: "Medics",
    news2Scale: "scale1",
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
    tasks: { ...emptyTasks },
    imagingText: "",
    referralChoice: "Surgeons",
    news2Scale: "scale1",
  },
];

const STORAGE_KEY = "ed-tracker-patients-v1";

function loadPatientsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch (err) {
    console.warn("Failed to load patients from localStorage", err);
    return null;
  }
}

function App() {
  const [patients, setPatients] = useState(
    () => loadPatientsFromStorage() || initialPatients
  );
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const [note, setNote] = useState("");
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    patientId: "",
    presentingComplaint: "",
    triage: "Amber",
    phone: "",
    emergencyContact: "",
    address: "",
    gpName: "",
    gpPractice: "",
    gpPhone: "",
  });

  // Persist patients whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch (err) {
      console.warn("Failed to save patients to localStorage", err);
    }
  }, [patients]);

  const handleResetDemo = () => {
    if (
      !confirm(
        "Reset to demo data? This will discard all patients you've added."
      )
    )
      return;
    setPatients(initialPatients);
    setSelectedPatientId(null);
  };
  const selectedPatient =
    patients.find((p) => p.id === selectedPatientId) || null;

  // Generic helper: apply a partial update to a single patient by id
  const updatePatient = (id, updater) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updater(p) } : p))
    );
  };

  const handleRowClick = (id) => {
    setSelectedPatientId(id);
    setNote("");
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
    if (!selectedPatientId) return;
    updatePatient(selectedPatientId, (p) => {
      // Once done, stays done — same behaviour as before
      if (p.tasks?.[name]) return {};
      return { tasks: { ...(p.tasks || emptyTasks), [name]: true } };
    });
  };

  const updateImagingText = (value) => {
    if (!selectedPatientId) return;
    updatePatient(selectedPatientId, () => ({ imagingText: value }));
  };

  const updateReferralChoice = (value) => {
    if (!selectedPatientId) return;
    updatePatient(selectedPatientId, () => ({ referralChoice: value }));
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

    updatePatient(selectedPatientId, (p) => ({
      notes: [...(p.notes || []), { time: timestamp, text: note.trim() }],
    }));
    setNote("");
  };

  // Live NEWS2 calculation as the user types — uses the patient's
  // selected scale (scale1 default, scale2 for hypercapnic respiratory
  // failure)
  const activeScale = selectedPatient?.news2Scale || "scale1";
  const liveNews = useMemo(
    () => calculateNews2(newNews, activeScale),
    [newNews, activeScale]
  );

  const setNews2Scale = (scale) => {
    if (!selectedPatientId) return;
    updatePatient(selectedPatientId, () => ({ news2Scale: scale }));
  };

  const handleAddNewsEntry = () => {
    if (!selectedPatientId) return;
    if (liveNews.total === null) {
      alert("Please enter at least one observation before saving.");
      return;
    }

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
      score: String(liveNews.total),
    };

    updatePatient(selectedPatientId, (p) => ({
      newsHistory: [...(p.newsHistory || []), entry],
      newsScore: liveNews.total,
    }));

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

  const resetAddForm = () => {
    setNewPatient({
      name: "",
      patientId: "",
      presentingComplaint: "",
      triage: "Amber",
      phone: "",
      emergencyContact: "",
      address: "",
      gpName: "",
      gpPractice: "",
      gpPhone: "",
    });
  };

  const handleAddPatient = () => {
    if (!newPatient.name.trim() || !newPatient.presentingComplaint.trim()) {
      alert("Name and presenting complaint are required.");
      return;
    }

    const nextId =
      patients.length === 0 ? 1 : Math.max(...patients.map((p) => p.id)) + 1;

    const created = {
      id: nextId,
      patientId: newPatient.patientId.trim() || `H${100000 + nextId}`,
      name: newPatient.name.trim(),
      address: newPatient.address.trim(),
      gpName: newPatient.gpName.trim(),
      gpPractice: newPatient.gpPractice.trim(),
      gpPhone: newPatient.gpPhone.trim(),

      timeInDept: "0:00",
      triage: newPatient.triage,
      referral: "—",
      phone: newPatient.phone.trim(),
      emergencyContact: newPatient.emergencyContact.trim(),
      presentingComplaint: newPatient.presentingComplaint.trim(),
      status: "Awaiting clinician",

      newsScore: 0,
      newsHistory: [],

      notes: [],
      tasks: { ...emptyTasks },
      imagingText: "",
      referralChoice: referralOptions[0],
    };

    setPatients((prev) => [...prev, created]);
    setShowAddForm(false);
    resetAddForm();
  };

  return (
    <div className="app">
      <header className="top-bar">
        <h1>ED Tracker</h1>
        <div className="top-bar-actions">
          <button
            className="ghost-btn"
            onClick={handleResetDemo}
            title="Reset patient list to the original demo data"
          >
            Reset demo
          </button>
          <button
            className="primary-btn"
            onClick={() => setShowAddForm(true)}
          >
            Add Patient
          </button>
        </div>
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
              <div><strong>Address:</strong> {selectedPatient.address || "—"}</div>
              <div><strong>Phone:</strong> {selectedPatient.phone || "—"}</div>
              <div><strong>Emergency Contact:</strong> {selectedPatient.emergencyContact || "—"}</div>
              <div>
                <strong>GP:</strong>{" "}
                {selectedPatient.gpName
                  ? `${selectedPatient.gpName} (${selectedPatient.gpPractice}) – ${selectedPatient.gpPhone}`
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
              onClick={handleSubmitNote}
            >
              Submit Note
            </button>

            <div className="tasks">
              <label>
                <input
                  type="checkbox"
                  checked={!!selectedPatient.tasks?.triage}
                  disabled={!!selectedPatient.tasks?.triage}
                  onChange={() => toggleTask("triage")}
                />
                Triage
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!selectedPatient.tasks?.bloods}
                  disabled={!!selectedPatient.tasks?.bloods}
                  onChange={() => toggleTask("bloods")}
                />
                Bloods
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!selectedPatient.tasks?.imaging}
                  disabled={!!selectedPatient.tasks?.imaging}
                  onChange={() => toggleTask("imaging")}
                />
                Imaging
              </label>
              <input
                type="text"
                className="imaging-input"
                value={selectedPatient.imagingText || ""}
                onChange={(e) => updateImagingText(e.target.value)}
                placeholder="state imaging (e.g. CXR, CT head)"
              />
              <label>
                <input
                  type="checkbox"
                  checked={!!selectedPatient.tasks?.referral}
                  disabled={!!selectedPatient.tasks?.referral}
                  onChange={() => toggleTask("referral")}
                />
                Referral
              </label>
              <select
                value={selectedPatient.referralChoice || referralOptions[0]}
                onChange={(e) => updateReferralChoice(e.target.value)}
              >
                {referralOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: "16px" }}>
              <strong>Notes History:</strong>
              {(!selectedPatient.notes || selectedPatient.notes.length === 0) && (
                <p style={{ color: "#666" }}>No notes yet.</p>
              )}
              <ul style={{ paddingLeft: "16px" }}>
                {(selectedPatient.notes || []).map((n, index) => (
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
                <div className="news-header">
                  <h3>NEWS chart</h3>
                  <div className="scale-toggle" role="group" aria-label="NEWS2 SpO2 scale">
                    <button
                      type="button"
                      className={`scale-btn ${
                        activeScale === "scale1" ? "active" : ""
                      }`}
                      onClick={() => setNews2Scale("scale1")}
                      title="Standard adult scale (target SpO2 ≥96%)"
                    >
                      Scale 1
                    </button>
                    <button
                      type="button"
                      className={`scale-btn ${
                        activeScale === "scale2" ? "active" : ""
                      }`}
                      onClick={() => setNews2Scale("scale2")}
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
                    NEWS (auto, {activeScale === "scale2" ? "Scale 2" : "Scale 1"})
                    <div
                      className={`news-auto news-band-${newsRiskBand(
                        liveNews.total
                      )}`}
                    >
                      {liveNews.total === null ? "—" : liveNews.total}
                    </div>
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

      {/* Add Patient modal */}
      {showAddForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-header">
              <h2>Add patient</h2>
              <button onClick={() => setShowAddForm(false)}>Close</button>
            </div>

            <div className="add-form">
              <label>
                Name *
                <input
                  type="text"
                  value={newPatient.name}
                  onChange={(e) =>
                    setNewPatient((n) => ({ ...n, name: e.target.value }))
                  }
                  placeholder="Surname, First name"
                />
              </label>
              <label>
                Patient ID
                <input
                  type="text"
                  value={newPatient.patientId}
                  onChange={(e) =>
                    setNewPatient((n) => ({ ...n, patientId: e.target.value }))
                  }
                  placeholder="e.g. H123456"
                />
              </label>
              <label className="full-row">
                Presenting complaint *
                <input
                  type="text"
                  value={newPatient.presentingComplaint}
                  onChange={(e) =>
                    setNewPatient((n) => ({
                      ...n,
                      presentingComplaint: e.target.value,
                    }))
                  }
                  placeholder="e.g. Central chest pain"
                />
              </label>
              <label>
                Triage
                <select
                  value={newPatient.triage}
                  onChange={(e) =>
                    setNewPatient((n) => ({ ...n, triage: e.target.value }))
                  }
                >
                  {triageOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </label>
              <label>
                Phone
                <input
                  type="text"
                  value={newPatient.phone}
                  onChange={(e) =>
                    setNewPatient((n) => ({ ...n, phone: e.target.value }))
                  }
                  placeholder="07…"
                />
              </label>
              <label className="full-row">
                Address
                <input
                  type="text"
                  value={newPatient.address}
                  onChange={(e) =>
                    setNewPatient((n) => ({ ...n, address: e.target.value }))
                  }
                />
              </label>
              <label>
                Emergency contact
                <input
                  type="text"
                  value={newPatient.emergencyContact}
                  onChange={(e) =>
                    setNewPatient((n) => ({
                      ...n,
                      emergencyContact: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                GP name
                <input
                  type="text"
                  value={newPatient.gpName}
                  onChange={(e) =>
                    setNewPatient((n) => ({ ...n, gpName: e.target.value }))
                  }
                />
              </label>
              <label>
                GP practice
                <input
                  type="text"
                  value={newPatient.gpPractice}
                  onChange={(e) =>
                    setNewPatient((n) => ({ ...n, gpPractice: e.target.value }))
                  }
                />
              </label>
              <label>
                GP phone
                <input
                  type="text"
                  value={newPatient.gpPhone}
                  onChange={(e) =>
                    setNewPatient((n) => ({ ...n, gpPhone: e.target.value }))
                  }
                />
              </label>
            </div>

            <button
              className="primary-btn full-width"
              style={{ marginTop: "16px" }}
              onClick={handleAddPatient}
            >
              Add patient
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;