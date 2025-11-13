import { useState } from "react";
import "./App.css";

const mockPatients = [
  {
    id: 1,
    patientId: "H123456",
    name: "John Smith",
    address: "24 Green Street, London E1 6AA",
    gpName: "Dr. Patel",
    gpPractice: "Whitechapel Health Centre",
    gpPhone: "0207 123 4567",

    timeInDept: "3:57",
    triage: "Red",
    referral: "Medics",
    phone: "07123 456789",
    emergencyContact: "Jane Smith",
    newsScore: 4,
    presentingComplaint: "Central chest pain",
    status: "Waiting medical review",
    notes: [],
  },
  {
    id: 2,
    patientId: "H987654",
    name: "Sarah Ahmed",
    address: "12 Oak Avenue, London N1 4QR",
    gpName: "Dr. Williams",
    gpPractice: "North Road Medical Centre",
    gpPhone: "0208 222 1133",

    timeInDept: "2:10",
    triage: "Amber",
    referral: "Surgeons",
    phone: "07111 222333",
    emergencyContact: "Mother",
    newsScore: 2,
    presentingComplaint: "RIF pain",
    status: "Waiting surgical review",
    notes: [],
  },
];

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

function App() {
  const [patients, setPatients] = useState(mockPatients);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [note, setNote] = useState("");
  const [tasks, setTasks] = useState({
    triage: false,
    bloods: false,
    imaging: false,
    referral: false,
  });
  const [imagingText, setImagingText] = useState("");
  const [referral, setReferral] = useState(referralOptions[0]);

  const handleRowClick = (patient) => {
    setSelectedPatient(patient);
    // reset form when you open a patient
    setNote("");
    setTasks({ triage: false, bloods: false, imaging: false, referral: false });
    setImagingText("");
    setReferral(referralOptions[0]);
  };

  const toggleTask = (name) => {
    setTasks((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDischarge = () => {
    if (!selectedPatient) return;
    // very simple: remove patient from list
    setPatients((prev) => prev.filter((p) => p.id !== selectedPatient.id));
    setSelectedPatient(null);
  };

  const handleSubmitNote = () => {
    if (!note.trim() || !selectedPatient) return;
  
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  
    const newNote = {
      time: timestamp,
      text: note.trim(),
    };
  
    // update all patients with new note
    const updatedPatients = patients.map((p) =>
      p.id === selectedPatient.id
        ? { ...p, notes: [...p.notes, newNote] }
        : p
    );
  
    setPatients(updatedPatients);
  
    // update selected patient with latest notes
    const updatedPatient = updatedPatients.find(
      (p) => p.id === selectedPatient.id
    );
  
    setSelectedPatient(updatedPatient);
  
    // clear text box
    setNote("");
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
        {/* Left: table */}
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
                <tr key={p.id} onClick={() => handleRowClick(p)}>
                <td>{p.name}</td>
                <td>{p.presentingComplaint}</td>
                <td>{p.timeInDept}</td>
                <td>
                  <span className={`triage-dot triage-${p.triage.toLowerCase()}`} />
                  {p.triage}
                </td>
                <td>{p.newsScore}</td>
                <td>{p.referral}</td>
                <td>{p.status}</td>
              </tr>
              
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No patients – all seen!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right: selected patient panel */}
        {selectedPatient && (
          <div className="detail-card">
            <div className="detail-header">
              <h2>{selectedPatient.name}</h2>
              <button onClick={() => setSelectedPatient(null)}>Close</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
  <p><strong>Contact Info</strong></p>

  <p><strong>Patient ID:</strong> {selectedPatient.patientId}</p>
  <p><strong>Address:</strong> {selectedPatient.address}</p>

  <p><strong>Phone:</strong> {selectedPatient.phone}</p>
  <p><strong>Emergency Contact:</strong> {selectedPatient.emergencyContact}</p>

  <p><strong>Registered GP:</strong> {selectedPatient.gpName}</p>
  <p><strong>GP Practice:</strong> {selectedPatient.gpPractice}</p>
  <p><strong>GP Phone:</strong> {selectedPatient.gpPhone}</p>
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
                  onChange={() => toggleTask("triage")}
                />
                Triage
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={tasks.bloods}
                  onChange={() => toggleTask("bloods")}
                />
                Bloods
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={tasks.imaging}
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
              <strong>NEWS:</strong> {selectedPatient.newsScore}{" "}
              <button
                className="link-btn"
                onClick={() =>
                  alert("Here you could show a proper NEWS chart modal")
                }
              >
                View chart
              </button>
            </div>

            <button className="primary-btn full-width" onClick={handleDischarge}>
              Discharge Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
