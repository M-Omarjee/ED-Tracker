# 🏥 ED Tracker — Emergency Department Patient Management Tool

A lightweight, fast, and clean Emergency Department (ED) tracker built using **React + Vite**.  
Designed to replicate the functionality of real-world NHS ED systems such as EDIS, Symphony, and Medway — but simpler, faster, and customisable.

This tool lets clinicians quickly view patient flow, monitor tasks, document notes, and track NEWS scores.

---

## 🚀 Features

### 🔍 **Live Patient Table (Full-Width)**
- Patient name  
- Presenting complaint  
- Time in department  
- Triage category (colour-coded: Red / Amber / Green)  
- NEWS score  
- Referral team  
- Status / Update (e.g. “Waiting medical review”, “Waiting CXR”, etc.)

### 🧑‍⚕️ **Detailed Patient Panel**
When clicking on a patient:
- Contact information  
- **Patient ID**
- **Address**
- **GP details**  
- Emergency contact  
- Clerking / plan / handover notes text box  
- Task checkboxes:
  - Triage
  - Bloods
  - Imaging (+ free-text imaging field)
  - Referral + speciality dropdown  
- NEWS score + “View chart”

### 🗒️ **Notes System**
- Submit clinical notes (clerking, plan, handover, updates)  
- Notes appear in a timestamped list  
- Stored per patient  
- Clear chronological timeline

### 🧹 **Clean UI**
- NHS-style layout  
- Large table with auto-aligned columns  
- Responsive full-width grid  
- Modern, minimal, clinical feel

---

## 🛠️ Tech Stack

- **React (Vite)** — fast dev environment  
- **JavaScript (ES6+)**  
- **CSS** — custom, clean styling  
- **No backend yet** (all mock data local)

---

## 📦 Installation

```bash
git clone https://github.com/YOURUSERNAME/ED-Tracker.git
cd ED-Tracker
npm install
npm run dev
```

Open:
http://localhost:5173


## 📁 Project Structure
```bash
src/
  App.jsx          # Main UI + state management
  App.css          # Table + panel styling
  index.css        # Global styling + layout rules
public/
```

## 📌 Roadmap

### 🔜 Coming Next
Add patient form (modal)
Editable notes
Editable patient status
Colour-coded NEWS badges
Auto-updating "Time in department"
Sorting & filtering: triage, referral, status
Disposition (admit/discharge) flow

### 🔥 Future Features
Login system
Cloud backend (Firebase or Express/Postgres)
Persist patient data
Full NEWS chart
Imaging timeline
Task audit trail
Safeguarding / sepsis flags
Export to PDF
Mobile ED tablet mode

## 🤝 Contributing
Pull requests welcome.
If you'd like to suggest features or improvements, open an issue.

## 👨‍⚕️ Author
Built by Dr. Muhammed Omarjee
Clinician • Developer • Health-Tech Innovator
