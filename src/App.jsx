import { useState, useEffect } from "react";
import "./App.css";
import TopBar from "./components/TopBar";
import PatientTable from "./components/PatientTable";
import PatientDetail from "./components/PatientDetail";
import AddPatientModal from "./components/AddPatientModal";
import ParsePreviewModal from "./components/ParsePreviewModal";
import DischargeSummaryModal from "./components/DischargeSummaryModal";
import { extractClerking, generateDischargeSummary } from "./lib/llm";

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

const emptyNewNews = {
  time: "",
  rr: "",
  spo2: "",
  o2: "",
  temp: "",
  sbp: "",
  hr: "",
  avpu: "",
  score: "",
};

const emptyNewPatient = {
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
};

function App() {
  const [patients, setPatients] = useState(
    () => loadPatientsFromStorage() || initialPatients
  );
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const [note, setNote] = useState("");
  const [newNews, setNewNews] = useState(emptyNewNews);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState(emptyNewPatient);
  const [parseInProgress, setParseInProgress] = useState(false);
  const [parsePreview, setParsePreview] = useState(null); // {parsed, source, error} when modal should show
  const [dischargeInProgress, setDischargeInProgress] = useState(false);
  const [dischargePreview, setDischargePreview] = useState(null);
  const [dischargingPatientId, setDischargingPatientId] = useState(null);

  // Persist patients whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch (err) {
      console.warn("Failed to save patients to localStorage", err);
    }
  }, [patients]);

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
    setNewNews(emptyNewNews);
  };

  const handleClosePatient = () => {
    setSelectedPatientId(null);
  };

  const toggleTask = (name) => {
    if (!selectedPatientId) return;
    updatePatient(selectedPatientId, (p) => {
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

  const setNews2Scale = (scale) => {
    if (!selectedPatientId) return;
    updatePatient(selectedPatientId, () => ({ news2Scale: scale }));
  };

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

  const handleDischarge = async () => {
    if (!selectedPatientId || !selectedPatient) return;
    setDischargeInProgress(true);
    setDischargingPatientId(selectedPatientId);
    try {
      const result = await generateDischargeSummary(selectedPatient);
      setDischargePreview(result);
    } finally {
      setDischargeInProgress(false);
    }
  };

  const handleConfirmDischarge = () => {
    const idToRemove = dischargingPatientId;
    if (!idToRemove) {
      setDischargePreview(null);
      return;
    }
    setPatients((prev) => prev.filter((p) => p.id !== idToRemove));
    if (selectedPatientId === idToRemove) {
      setSelectedPatientId(null);
    }
    setDischargingPatientId(null);
    setDischargePreview(null);
  };

  const handleCancelDischarge = () => {
    setDischargePreview(null);
    setDischargingPatientId(null);
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

  const handleAddNewsEntry = (liveNews) => {
    if (!selectedPatientId) return;
    if (!liveNews || liveNews.total === null) {
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

    setNewNews(emptyNewNews);
  };

  const handleParseClerking = async () => {
    if (!note.trim() || !selectedPatientId) return;
    setParseInProgress(true);
    try {
      const result = await extractClerking(note);
      setParsePreview(result);
    } finally {
      setParseInProgress(false);
    }
  };

  const handleApplyParse = (data) => {
    if (!selectedPatientId) {
      setParsePreview(null);
      return;
    }
    updatePatient(selectedPatientId, (p) => {
      const update = {};
      if (data.presentingComplaint) {
        update.presentingComplaint = data.presentingComplaint;
      }
      if (data.triage) {
        update.triage = data.triage;
      }
      // Pre-fill the NEWS observation form (does not save automatically;
      // user reviews + clicks Save NEWS entry to commit)
      return update;
    });

    // Pre-fill the NEWS form with the extracted obs so the user only
    // has to click Save NEWS entry to commit them.
    if (data.observations) {
      setNewNews((n) => ({
        ...n,
        rr: data.observations.rr || "",
        spo2: data.observations.spo2 || "",
        o2: data.observations.o2 || "",
        temp: data.observations.temp || "",
        sbp: data.observations.sbp || "",
        hr: data.observations.hr || "",
        avpu: data.observations.avpu || "",
      }));
    }

    setParsePreview(null);
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
      news2Scale: "scale1",
    };

    setPatients((prev) => [...prev, created]);
    setShowAddForm(false);
    setNewPatient(emptyNewPatient);
  };

  return (
    <div className="app">
      <TopBar
        onAddPatient={() => setShowAddForm(true)}
        onResetDemo={handleResetDemo}
      />

      <div className="content">
        <PatientTable patients={patients} onRowClick={handleRowClick} />

        {selectedPatient && (
          <PatientDetail
            patient={selectedPatient}
            note={note}
            setNote={setNote}
            newNews={newNews}
            setNewNews={setNewNews}
            parseInProgress={parseInProgress}
            dischargeInProgress={dischargeInProgress}
            onClose={handleClosePatient}
            onSubmitNote={handleSubmitNote}
            onToggleTask={toggleTask}
            onUpdateImagingText={updateImagingText}
            onUpdateReferralChoice={updateReferralChoice}
            onSetNews2Scale={setNews2Scale}
            onAddNewsEntry={handleAddNewsEntry}
            onDischarge={handleDischarge}
            onParseClerking={handleParseClerking}
          />
        )}
      </div>

      {showAddForm && (
        <AddPatientModal
          newPatient={newPatient}
          setNewPatient={setNewPatient}
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddPatient}
        />
      )}

{parsePreview && (
        <ParsePreviewModal
          initialData={parsePreview.parsed}
          source={parsePreview.source}
          error={parsePreview.error}
          onCancel={() => setParsePreview(null)}
          onApply={handleApplyParse}
        />
      )}

      {dischargePreview && dischargingPatientId !== null && (
        <DischargeSummaryModal
          patient={
            patients.find((p) => p.id === dischargingPatientId) ||
            selectedPatient
          }
          initialSummary={dischargePreview.summary}
          source={dischargePreview.source}
          error={dischargePreview.error}
          onCancel={handleCancelDischarge}
          onConfirmDischarge={handleConfirmDischarge}
        />
      )}
    </div>
  );
}

export default App;