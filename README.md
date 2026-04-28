# ED-Tracker — AI-Augmented Emergency Department Patient Tracker

[![Live demo](https://img.shields.io/badge/demo-live-success?logo=vercel&logoColor=white)](https://ed-tracker-seven.vercel.app)
[![React 19](https://img.shields.io/badge/react-19-61dafb.svg?logo=react&logoColor=white)](https://react.dev)
[![Vite 7](https://img.shields.io/badge/vite-7-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Built with Claude](https://img.shields.io/badge/AI-Claude%20Sonnet%204.5-D97757)](https://www.anthropic.com/claude)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A doctor-built web app for tracking patients in an Emergency Department, with two genuinely useful AI features powered by Claude:

1. **Free-text → structured form** — paste a clerking narrative, Claude extracts presenting complaint, observations, and triage suggestion
2. **AI-generated discharge summaries** — one click produces a complete, editable discharge summary from everything entered during the patient's stay

**🔗 Live demo:** [ed-tracker-seven.vercel.app](https://ed-tracker-seven.vercel.app)

Built by a resident doctor who got tired of the friction between writing free-text clerkings and filling in identical structured fields, and of writing the same discharge summary patterns by hand at the end of every shift.

---

## Try it

The live demo includes 4 demo accounts (different roles). Click "Show demo accounts" on the login page or use:

| Username      | Role   | Password |
|---------------|--------|----------|
| `drpatel`     | Doctor | `demo123`  |
| `drwilliams`  | Doctor | `demo123`  |
| `nursekhan`   | Nurse  | `demo123`  |
| `hcasmith`    | HCA    | `demo123`  |

---

## What it does

<p align="center">
  <img src="assets/screenshots/ed_app_top.png" width="90%" alt="ED-Tracker patient table" />
</p>

The core flow mirrors how UK ED tracker software (EDIS, Symphony, Medway) actually works:

- **Patient table** — name, presenting complaint, **live time-in-dept timer**, **clinician-seen timer**, triage badge, NEWS, referral, status
- **Click a patient** to open a detail panel with contact / GP info, free-text notes, ED tasks (triage, bloods, imaging, referral), structured **bloods entry** (FBC / U&Es / LFTs / inflammatory / blood gas), and an expandable **NEWS chart** with three tabs: entry, reference grid, trend
- **NEWS2 auto-calculated** using the Royal College of Physicians 2017 spec, with per-patient Scale 1 / Scale 2 toggle for hypercapnic respiratory failure
- **Every clinical entry is signed and locked** — notes, NEWS observations, and blood results all carry author identity and require password re-verification before submission
- **Discharge** — generates an AI-powered discharge summary the doctor can edit, copy, or download as a PDF

State persists to `localStorage` so the patient list survives refreshes. A **Reset demo** button restores the canonical demo state for portfolio viewers.

---

## The "AI" earns its name

This isn't an `if/else` engine dressed up with marketing. Both AI features are real Claude calls, with thoughtful prompt engineering and a trust-preserving UX (the doctor reviews and edits every AI output before it lands in the record).

### Feature 1 — Parse free-text into structured fields

Paste a narrative clerking. Claude extracts:
- Presenting complaint (concise, headline-style)
- All seven observations (RR, SpO₂, O₂ device, temp, SBP, HR, AVPU)
- A suggested triage band (Red / Amber / Green) per NHS conventions

The result appears in an **editable preview modal** — the doctor reviews and applies, never auto-write. The NEWS form pre-fills so committing the obs takes one click.

<p align="center">
  <img src="assets/screenshots/ed_parse_modal.png" width="80%" alt="Claude-extracted clerking data" />
</p>

### Feature 2 — AI-generated discharge summaries

Click "Discharge with AI summary." Claude reads the entire patient record (notes chronologically, NEWS history with trend, tasks completed, blood results with both timestamps, imaging, referrals) and produces a six-section discharge summary:

- Diagnosis / working differential
- Investigations performed (with actual blood values quoted)
- Management in ED
- Plan / disposition
- Follow-up arrangements
- A GP-letter paragraph in third-person prose

Every section is editable. Output options: copy as text, download PDF, or confirm discharge.

<p align="center">
  <img src="assets/screenshots/ed_discharge_modal.png" width="85%" alt="AI-generated discharge summary modal" />
</p>

A behavioural detail worth noting: when the patient record contains obviously synthetic data (e.g. all blood values identical), Claude declines to quote the values and notes them as "results pending" instead. That's the clinically-correct calibration — an AI that refuses to confidently quote dummy data.

---

## Audit trail and signing

Real EPRs (Cerner Millennium, EPIC) require password re-verification before authoritative actions. ED-Tracker mirrors this:

- **Every clinical entry is signed** — notes, NEWS observations, and blood results all stamp the current user's name, role, and a full ISO timestamp
- **Every entry is locked** — once submitted, content cannot be edited or deleted
- **Re-auth required** — submitting a note, saving a NEWS entry, or saving blood results all open a password modal that must be confirmed before the entry commits
- **Cancel preserves draft** — if the user cancels at the password prompt, their typed work stays in the form

Notes appear in the history with an author pill (e.g. "Dr A. Patel · DOCTOR"). Clicking opens a read-only modal with the full timestamp, author block, and a locked banner. Same pattern for blood results.

---

## NEWS2 — official chart + trend

A clinical detail worth highlighting because it's where most "NEWS calculator" projects cut corners:

NEWS2 has two scales for SpO₂ scoring:
- **Scale 1** (default adult): target SpO₂ ≥96%
- **Scale 2** (hypercapnic respiratory failure, e.g. severe COPD): target SpO₂ 88-92%

The clinically critical bit: on Scale 2, **breathing supplemental oxygen at SpO₂ ≥93% scores higher than breathing air at the same SpO₂**, because hyperoxygenation in T2RF risks CO₂ retention. The toggle lives on the patient (per-patient clinical decision, not per-observation), and the score recalculates instantly when flipped.

The NEWS chart card has three tabs:
- **Add entry** — the live-calculated observation form
- **Reference grid** — the official RCP NEWS2 scoring grid, with the bands triggered by the most recent observation highlighted
- **Trend** — vital signs over time with traffic-light colouring per parameter

Reference: [RCP NEWS2 (July 2017)](https://www.rcplondon.ac.uk/projects/outputs/national-early-warning-score-news-2)

---

## Architecture

```
Browser (React)                     Vercel                          Anthropic
[free text input]    ──POST──▶   /api/extract-clerking   ──POST──▶  Claude API
(serverless function)               (sk-ant-... lives here,
│                              never in the bundle)
[parsed obs]        ◀──JSON───        │
reads ANTHROPIC_API_KEY
from Vercel env vars
```
Two serverless functions handle Claude calls; the React app never sees the API key.

```
ED-Tracker/
├── api/
│   ├── extract-clerking.js          # narrative → structured JSON
│   └── generate-discharge-summary.js # patient record → discharge document
├── src/
│   ├── App.jsx                       # state orchestrator
│   ├── App.css
│   ├── lib/
│   │   ├── auth.js                   # demo users, session helpers
│   │   ├── llm.js                    # frontend client for /api endpoints
│   │   ├── news.js                   # NEWS2 calculator (Scale 1 + Scale 2)
│   │   └── time.js                   # duration formatters + timer helpers
│   └── components/
│       ├── LoginPage.jsx
│       ├── TopBar.jsx
│       ├── StatsBanner.jsx           # 3-card KPI banner
│       ├── PatientTable.jsx          # in-department list with live timers
│       ├── PatientDetail.jsx         # per-patient panel
│       ├── NewsChart.jsx             # tabbed NEWS card (entry / ref / trend)
│       ├── AddPatientModal.jsx       # new patient form
│       ├── BloodsModal.jsx           # 6-panel structured bloods entry
│       ├── BloodsHistory.jsx         # signed bloods list + detail modal
│       ├── NotesHistory.jsx
│       ├── NoteDetailModal.jsx       # read-only signed note view
│       ├── ParsePreviewModal.jsx     # AI extract review modal
│       ├── DischargeSummaryModal.jsx # AI discharge review + PDF export
│       └── PasswordConfirmModal.jsx  # re-auth before signed actions
└── assets/
└── screenshots/                  # README images
```

**Stack:** React 19, Vite 7, plain CSS, jsPDF, `@anthropic-ai/sdk`, Vercel Functions. No backend database, no server-side storage. State is per-browser (`localStorage`) by design — no patient data ever leaves the user's browser except the narrative paste / discharge generation calls, which go to Claude via Vercel.

---

## Demo authentication

The login system uses 4 hardcoded demo accounts with cleartext password comparison. **This is intentionally simplified for portfolio purposes.** The architectural shape (login → session → attributed actions → re-auth → logout) is identical to a production system; only the credential check is simplified.

A real deployment would replace `src/lib/auth.js` with:
- A backend (Vercel KV / Postgres / Supabase) storing bcrypt-hashed passwords
- Server-issued JWT or session cookies with refresh
- HTTPS-only secure cookies

The dependency boundary is clean: `auth.js` exports `validateLogin()` and `verifyPassword()` and nothing else uses the demo user list directly. Swapping in a real auth provider would not touch any other file.

---

## Run locally

```bash
git clone https://github.com/M-Omarjee/ED-Tracker.git
cd ED-Tracker

npm install

# Add your Anthropic API key (get one at console.anthropic.com)
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local

# Run with full Vercel emulation (serverless functions + frontend)
vercel dev

# Or just the frontend (AI features will return "fallback")
npm run dev
```

For the full AI experience locally you need `vercel dev` so the serverless functions run.

---

## Limitations and honest scope

- **Demo data only.** The two demo patients (John Smith, Sarah Ahmed) are entirely synthetic
- **Demo authentication.** Cleartext passwords compared against a hardcoded user list — see "Demo authentication" section above
- **No backend / no real persistence.** State persists to `localStorage` only. Each user's browser holds their own data
- **No imaging or LIMS integration.** Imaging is a free-text label; bloods are entered manually. The bloods schema is designed to map to FHIR Observation / LOINC for a future LIMS integration
- **NEWS2 only.** No paediatric (PEWS) or maternal (MEOWS) early warning scores
- **AI output is a draft, not a clinical decision.** Claude is wrong sometimes. Both AI features show the output in editable preview modals so the doctor reviews before applying. The PDF footer says "please verify before clinical use"

---

## Roadmap

- [ ] NHS LIMS integration (FHIR Observation pull, replacing manual blood entry)
- [ ] PEWS / MEOWS support
- [ ] Trust-branded discharge PDF (logo upload, header colour)
- [ ] Multi-clinician handover (shift change with notes carry-over)
- [ ] Real backend auth (Vercel KV + bcrypt + JWT)
- [ ] Audit log for discharged patients (currently they're removed from view; the dischargedAt timestamp is captured for future use)

---

## Author

**Dr Muhammed Omarjee**
Resident Doctor (MBBS, King's College London 2023)
Building practical AI tools for NHS frontline workflows.

Sister projects (live):
- [ECG-Explain](https://github.com/M-Omarjee/ecg-explain) — 12-lead ECG classifier with per-lead Grad-CAM (PTB-XL, AUROC 0.91)
- [Sepsis-AI](https://github.com/M-Omarjee/sepsis-ai) — NEWS2 vs ML benchmark with decision curve analysis and subgroup audit
- [AuditAI](https://github.com/M-Omarjee/Audit-AI) — [Live](https://audit-ai-mo.streamlit.app) — AI-powered clinical audit tool with Claude-generated NICE/RCP-grounded recommendations

---

## License

[MIT](LICENSE)