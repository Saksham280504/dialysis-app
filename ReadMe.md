# DialysisRx — Nurse Shift Dashboard

A minimal-but-realistic dialysis center management system built for a 10-week internship assignment.

**Stack:** TypeScript · Express · MongoDB (Mongoose) · React (Vite) · No UI library

---

## Architecture

```
dialysis-app/
├── backend/            Express API (TypeScript)
│   └── src/
│       ├── index.ts    Entry point + seed data
│       ├── models.ts   Mongoose schemas (Patient, Session)
│       ├── routes.ts   REST endpoints
│       └── anomaly.ts  Anomaly detection engine
└── frontend/           React SPA (Vite + TypeScript)
    └── src/
        ├── App.tsx           Main dashboard
        ├── api/client.ts     Typed API wrapper
        ├── types/index.ts    Shared TypeScript interfaces
        ├── styles.css        Design system (CSS variables, dark theme)
        └── components/
            ├── SessionCard.tsx     Per-patient treatment card
            ├── AddSessionModal.tsx Add session form
            └── AnomalyBadge.tsx    Anomaly display components
```

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

### Backend

```bash
cd backend
cp .env.example .env        # edit MONGO_URI if needed
npm install
npm run dev                 # starts on http://localhost:4000
```

On first run, 5 demo patients and today's sessions are seeded automatically.

### Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

Vite proxies `/api` → `http://localhost:4000`.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/patients` | Register a patient |
| `GET` | `/api/patients` | List all patients |
| `GET` | `/api/patients/:id` | Get patient by ID |
| `POST` | `/api/sessions` | Record a dialysis session |
| `PATCH` | `/api/sessions/:id` | Update session (notes, vitals, status) |
| `GET` | `/api/sessions/today?unit=` | Today's schedule (with anomalies) |
| `GET` | `/api/sessions?patientId=&unit=&date=` | Flexible session query |
| `GET` | `/api/units` | List distinct unit names |

---

## MongoDB Schema Design

### Patient Document
```
{
  mrn: String (unique index),   // Medical Record Number — primary lookup key
  name, dateOfBirth, gender,
  dryWeight: Number,            // kg — embedded (changes infrequently, needed on every session read)
  unit: String (index),
  machineId, scheduledDays, targetDuration
}
```

### Session Document
```
{
  patientId: ObjectId → Patient (ref+index),
  unit (index), machineId, scheduledDate (index),
  status, startTime, endTime, durationMinutes,
  preWeight, postWeight,
  preVitals: { systolicBP, diastolicBP, heartRate },
  postVitals: { same },
  notes: String,
  anomalies: [{ type, message, value, threshold }]   // embedded — always read together
}
```

**Design decisions:**
- Anomalies are **embedded** in the session document — they are always read together with the session and recalculated on every write, so embedding avoids extra reads.
- `dryWeight` and `targetDuration` are on the Patient document, not duplicated per session — a PATCH to the session re-populates from the patient at write time.
- Compound unique index on `(patientId, scheduledDate)` prevents duplicate session entries.
- `unit` index on both collections enables efficient "today's schedule for unit" queries.

---

## Anomaly Detection

All logic lives in `backend/src/anomaly.ts`. Thresholds are configurable via `AnomalyConfig`.

### 1. Excess Interdialytic Weight Gain (IDWG)
**Threshold:** `preWeight − dryWeight > 3.5 kg`

**Justification:** KDOQI Clinical Practice Guidelines recommend restricting IDWG to <= 4–5% of dry body weight. For a typical 70 kg patient, 5% = 3.5 kg. Values above this threshold are associated with increased cardiovascular stress during ultrafiltration, hemodynamic instability, and pulmonary edema risk. 3.5 kg is a conservative upper bound used widely in bedside nursing protocols.

### 2. High Post-Dialysis Systolic BP
**Threshold:** `postVitals.systolicBP > 150 mmHg`

**Justification:** JNC 8 and KDOQI guidelines target a post-dialysis BP of < 130/80 mmHg. A post-treatment systolic above 140 mmHg has been linked to adverse cardiovascular outcomes in ESRD patients. We flag at 150 mmHg (rather than the ideal 130) to account for white-coat effect and measurement variability, flagging only readings that clearly exceed the safe range and warrant clinical action before discharge.

### 3. Short Session Duration
**Threshold:** `actualDuration < 80% × targetDuration`

**Justification:** Hemodialysis adequacy (Kt/V ≥ 1.2, URR ≥ 65%) depends critically on completing prescribed treatment time. Sessions terminated more than 20% early risk inadequate solute clearance. The 80% cut-off is used in CMS ESRD Quality Incentive Program (QIP) audits as the minimum acceptable session completion rate.

### 4. Long Session Duration
**Threshold:** `actualDuration > 120% × targetDuration`

**Justification:** Unexpectedly prolonged sessions often indicate repeated machine alarms, access problems, or hemodynamic instability requiring nursing intervention. Flagging at 120% prompts documentation review and assessment for access complications.

---

## Frontend Features

- **Today's Schedule** — all sessions for the shift with status (not started / in progress / completed)
- **Anomaly highlighting** — amber left-border stripe + badge on any card with anomalies
- **Anomaly filter** — toggle to show only patients with flagged sessions
- **Status filter** — click stat chips to filter by session status
- **Unit selector** — filter to a specific unit
- **Add Session** — full form: patient, machine, times, weights, pre/post vitals, notes
- **Edit Notes** — inline edit on any session card
- **Error states** — partial failure handling with retry (each API call in `Promise.allSettled`)
- **Loading / empty states** — handled for all data fetches

## NOTE- As for now, I have used a function called getAllSessions() to show all the sessions (not just of today), if you want today's sessions, just replace getAllSessions() with getTodaySessions() function in App.jsx