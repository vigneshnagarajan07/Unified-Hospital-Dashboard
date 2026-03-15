# Dynamic Hospital Performance Dashboard

> **VITC GlitchCon 2.0 Hackathon Submission**  
> Team Auraman 

Website-Link = https://primecar-liart.vercel.app/
An AI-powered, real-time operational intelligence platform for hospital performance monitoring — built end-to-end in 24 hours. The system ingests live hospital metrics across 6 departments, detects critical anomalies using a rule-based engine, and serves purpose-built dashboards to 5 distinct user roles.

**Live Demo:** https://vitc-glitch-con-hospital-dashboard.vercel.app

**Stack:** React 18 + Vite + Tailwind CSS (Frontend) | Python + FastAPI + Pydantic v2 (Backend) | Groq Llama 3 70b (AI Inference)  
**Scale:** 32 REST endpoints · 12 backend services · 33 React components · 348 tracked beds · 10 patient records across 6 departments

---

## What It Does

Most hospital dashboards are static reports. This platform is a live intelligence layer:

- Streams KPI metrics from 6 departments and computes a weighted **Hospital Health Score (0–100)** on every request
- Automatically flags anomalies against hard thresholds and classifies them as Warning or Critical with deviation percentages
- Sends the flagged context and live department state to **Groq's Llama 3 70b API** to generate 5 specific, prioritised remediation instructions for the admin
- Projects bed occupancy and OPD wait times **48 hours forward** in 6-hour intervals using linear trend slopes + day-of-week multipliers
- Renders a distinct, role-appropriate dashboard for every login — each built independently so adding a new role cannot break existing ones

---

## Repository Structure

```text
├── README.md
├── backend/
│   ├── main.py                    # FastAPI app & routing entrypoint
│   ├── requirements.txt
│   ├── core/
│   │   ├── config.py              # Thresholds, env vars, Groq settings
│   │   └── security.py            # JWT auth helpers (HS256, 8hr expiry)
│   ├── api/routers/               # Public API — 32 endpoints across 5 routers
│   │   ├── dashboard.py           # Role-specific composite dashboard payloads
│   │   ├── analytics.py           # KPI, aggregates, forecast
│   │   ├── patients.py            # Patient records, vitals, prescriptions
│   │   ├── staff.py               # Staff roster, bed management (CRUD)
│   │   └── insights.py            # AI insights, anomaly surface, recommendations
│   ├── services/                  # 12 intelligence & business-logic modules
│   │   ├── kpi_engine.py          # Health Score formula + % delta vs baseline
│   │   ├── anomaly_service.py     # 5-rule threshold scanner
│   │   ├── ai_service.py          # Groq prompt builder + structured fallback
│   │   ├── forecasting.py         # 48hr projection, day-of-week multipliers
│   │   ├── recommendation_engine.py
│   │   ├── hospital_agent.py      # Dashboard orchestration layer
│   │   └── prediction_engine.py
│   ├── models/                    # SQLAlchemy ORM models
│   ├── database/                  # DB connection & session management
│   └── data/                      # Data Access Layer (strict separation from logic)
│       ├── repository.py          # All data reads go through here
│       ├── hospital_data.py       # 6 departments, 348 beds, 7-day KPI history
│       ├── patient_data.py        # 10 seeded patients with diagnoses & vitals
│       └── staff_data.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                # Top-level routes & RBAC layout
        ├── api/client.js          # Axios wrapper — all 32 endpoints mapped
        ├── pages/                 # 6 role-based dashboard pages
        │   ├── LoginPage.jsx
        │   ├── AdminDashboard.jsx
        │   ├── DoctorDashboard.jsx
        │   ├── DepartmentHeadDashboard.jsx
        │   ├── FloorSupervisorDashboard.jsx
        │   └── PatientPortal.jsx
        └── modules/               # 7 feature modules (M1–M7), 33 components total
            ├── M1_DataAggregation/
            ├── M2_KPIEngine/
            ├── M3_AnomalyDetection/
            ├── M4_AIInsights/
            ├── M5_Recommendations/
            ├── M6_RoleViews/
            └── M7_Forecast/
```

---

## Quick Start

### Prerequisites
- Python ≥ 3.10
- Node.js ≥ 18

### 1. Clone the repo
```bash
git clone https://github.com/vigneshnagarajan07/VITC-GlitchCon-HospitalDashboard.git
cd VITC-GlitchCon-HospitalDashboard
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Optional — real AI insights:** Create a `.env` file inside `backend/` with your Groq key.  
Without it, the system automatically serves pre-written structured fallback insights — safe for demos.
```
GROQ_API_KEY=your_api_key_here
```

→ Backend: http://localhost:8000  
→ Swagger API Docs: http://localhost:8000/docs

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
→ Frontend: http://localhost:5173

---

## Roles and Access

The platform implements **Role-Based Access Control (RBAC)** across the full stack. Each role has a completely independent dashboard page — not a filtered view of one shared UI — so role-specific features can be changed without risking regressions in others.

| Role | Dashboard Focus |
|------|----------------|
| **Admin / CEO** | Hospital Health Score, AI-generated insights, revenue metrics, anomaly log, 48hr volume forecast |
| **Department Head** | Department KPIs, staff roster, surgery schedule, anomaly alerts scoped to their ward |
| **Doctor / Nurse** | Assigned patient list, OPD queues, prescriptions, critical patient alerts |
| **Floor Supervisor** | Live bed map (348 beds, editable per-bed), capacity alerts, admissions/discharges, staff on duty |
| **Patient Portal** | Personal timeline: active prescriptions, lab reports, vitals log, billing |

---

## The Intelligence Engines

All four engines live in `backend/services/` with no shared mutable state — each reads from the data layer and returns computed values, making them independently testable.

---

### Hospital Health Score — `kpi_engine.py`

A single 0–100 score computed as a weighted average of four operational metrics on every API request:

```
Health Score = (Bed Score × 0.30) + (Wait Score × 0.25) + (Satisfaction Score × 0.25) + (Surgery Score × 0.20)

  Bed Score         = 100 − bed_occupancy_%
  Wait Score        = 100 − (min(opd_wait_min, 60) / 60 × 100)
  Satisfaction Score = avg_patient_satisfaction × 20       # scales 0–5 rating to 0–100
  Surgery Score      = surgeries_completed / surgeries_scheduled × 100
```

| Score Range | Grade | Label |
|---|---|---|
| 85 – 100 | A | Excellent |
| 70 – 84 | B | Good |
| 55 – 69 | C | Needs Attention |
| 0 – 54 | D | Critical |

---

### Anomaly Detection — `anomaly_service.py`

A deterministic 5-rule scanner that runs against all 6 departments on every request. Thresholds are defined in `core/config.py` and can be adjusted without touching detection logic.

| Metric | Warning Threshold | Critical Threshold |
|---|---|---|
| Bed Occupancy | ≥ 80% | ≥ 90% |
| OPD Wait Time | ≥ 25 min | ≥ 35 min |
| Patient Satisfaction | ≤ 4.0 / 5 | ≤ 3.5 / 5 |
| Surgery Completion Rate | < 80% | < 65% |

Each anomaly object returned includes `deviation_pct` (how far the metric is from its per-department baseline), `severity`, and a `suggested_action` string — used directly in the frontend alert cards.

---

### AI Insights — `ai_service.py`

Builds a structured JSON prompt from live department data and active anomaly objects, then calls Groq (Llama 3 70b, 512 max tokens). The model is instructed to return a strict JSON array of exactly 5 insight objects:

```json
{
  "insight_id": "INS001",
  "title": "General Medicine overflow risk within 6 hours",
  "insight": "...",
  "department": "General Medicine",
  "priority": "critical",
  "category": "operational",
  "recommended_action": "Initiate discharge protocol for stable patients...",
  "impact_score": 9
}
```

If the Groq API call fails for any reason — missing key, network timeout, malformed JSON response — the `except` block returns `SIMULATED_INSIGHTS`, a pre-written list of 5 realistic insights that match the seeded anomaly data. The frontend cannot distinguish live from simulated output.

---

### 48-Hour Forecasting — `forecasting.py`

Generates 8 forecast points (6-hour intervals) using three inputs:

1. **Linear trend slope** — computed from 7-day KPI history arrays per department
2. **Day-of-week load multiplier** — Monday 1.10×, Friday 1.08×, Sunday 0.75×, etc.
3. **Confidence margin** — starts at ±2.0%, widens by 0.8% per interval (so the 48hr point carries ±7.6% uncertainty)

```python
projected_value = current + (slope × hours_ahead × day_multiplier)
upper_band = projected_value + confidence_margin
lower_band = projected_value − confidence_margin
```

The forecast also emits `forecast_alerts` — if any projected bed occupancy crosses 90%, the response includes an early-warning object attached to that interval.

---

## API Reference

All endpoints are prefixed under their router. The full interactive spec is at `/docs`.

**Analytics** — `/api/analytics/`
```
GET /summary               Hospital-wide aggregate KPIs
GET /departments           All 6 department summaries
GET /departments/{id}      Single department detail
GET /kpis                  Health Score + metric breakdown
GET /forecast              48hr projection with confidence bands
```

**Insights** — `/api/insights/`
```
GET /anomalies             All active anomalies with severity + deviation
GET /ai-insights           5 Groq-generated (or fallback) insights
GET /recommendations       Ranked action recommendations
```

**Dashboard** — `/api/dashboard/`
```
GET /admin                 Full admin payload (KPIs + anomalies + insights + forecast)
GET /department/{id}       Dept head payload scoped to one department
GET /doctor/{id}           Doctor payload with assigned patients
GET /patient/{id}          Patient portal payload
```

**Patients** — `/api/patients/`
```
GET /                      All patient records
GET /{id}                  Patient detail
GET /{id}/prescriptions    Active prescriptions
GET /{id}/lab-reports      Lab results
GET /{id}/vitals           Vitals log
GET /{id}/bill             Billing summary
GET /{id}/discharge-checklist
POST /{id}/ask             Ask AI a question about this patient
```

**Staff & Beds** — `/api/staff/`
```
GET /on-duty               Staff currently on shift
GET /doctors-on-duty       Doctors on duty
GET /beds/all              All 348 beds across all departments
GET /beds/{dept_id}        Beds for one department
PATCH /beds/{dept_id}      Update a single bed (status, patient assignment)
POST /beds/{dept_id}/bulk-update   Batch bed status update
```

---

## Mock Data & Seeded Anomalies

All data lives in `backend/data/` as a Data Access Layer strictly separated from business logic — all reads go through `repository.py`, not directly from the data files. The dataset includes:

- **6 departments:** Cardiology, General Medicine, Orthopedics, Pediatrics, Emergency, Obstetrics & Gynaecology
- **348 individual beds** across ward groups per department, each with status, patient assignment, and ward label
- **10 patients** with realistic diagnoses, vitals, prescriptions, lab results, and billing records
- **7-day KPI history arrays** per department for trend computation

Three anomalies are seeded intentionally to drive the demo:

- 🔴 **Cardiology OPD wait:** 47 min (+38% above the 34 min baseline) → triggers Critical Anomaly
- 🔴 **General Medicine bed occupancy:** 97% (+18% above the 82% baseline) → triggers High Severity + AI discharge suggestion
- 🔴 **Emergency ICU:** 6/6 beds occupied → ICU Full alert on Floor Supervisor dashboard

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'routers'`**  
Run `uvicorn` from inside the `backend/` directory, not the repo root. Python resolves imports relative to the working directory.

**Backend not connecting**  
Confirm FastAPI is running on port 8000: `uvicorn main:app --reload --port 8000`  
The frontend renders a connection error boundary if the backend is unreachable.

**`node_modules` missing**  
Run `npm install` inside the `frontend/` folder, not the repo root.

**`pip install` failing on Windows**  
Try: `pip install -r requirements.txt --break-system-packages`
