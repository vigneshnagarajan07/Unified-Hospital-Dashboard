Dynamic Hospital Performance Dashboard

> **VITC GlitchCon 2.0 Hackathon Submission**  
> Team Auraman | SNU Chennai

AI-powered, real-time operational intelligence for hospital performance monitoring. A comprehensive full-stack platform built with a modern Feature-Driven Frontend and Layered Domain-Driven Backend.

AI-powered Hospital Intelligence Dashboard with predictive analytics,
anomaly detection, and role-based hospital operations monitoring.

**Stack:** React + Vite + Tailwind (Frontend) | Python + FastAPI + Pydantic (Backend) | Groq Llama 3 API (AI)  
**Mode:** Real-time data, LLM-generated insights (with offline fallbacks), enterprise medical UI, and RBAC secure role-based views.

---

## Repository Structure

```text
├── README.md
├── backend/
│   ├── main.py                    # FastAPI app & routing entrypoint
│   ├── requirements.txt
│   ├── core/                      # App configuration & security
│   │   ├── config.py              # Environment vars, API keys (Groq)
│   │   └── security.py            # Auth / security helpers
│   ├── api/                       # Public API surface (versioned routers)
│   │   └── routers/
│   │       ├── dashboard.py       # Composite dashboard payloads
│   │       ├── analytics.py       # KPI & metrics endpoints
│   │       ├── patients.py        # Patient-centric endpoints
│   │       ├── staff.py           # Staff / bed endpoints
│   │       └── insights.py        # AI insights & anomaly surfacing
│   ├── routers/                   # Legacy metric-specific routers (M1–M7)
│   │   ├── m1_aggregation.py
│   │   ├── m2_kpi.py
│   │   ├── m3_anomaly.py
│   │   ├── m4_insights.py
│   │   ├── m5_recommendations.py
│   │   ├── m6_roles.py
│   │   └── m7_forecast.py
│   ├── services/                  # Intelligence & business-logic layer
│   │   ├── data_aggregator.py
│   │   ├── kpi_engine.py
│   │   ├── anomaly_service.py
│   │   ├── anomaly_detector.py
│   │   ├── prediction_engine.py
│   │   ├── forecasting.py
│   │   ├── insight_engine.py
│   │   ├── recommendation_engine.py
│   │   ├── root_cause_engine.py
│   │   ├── hospital_agent.py
│   │   └── ai_service.py
│   ├── models/                    # SQLAlchemy / ORM models
│   │   └── models.py
│   ├── database/                  # DB connection & session management
│   │   └── db.py
│   ├── schemas/                   # Pydantic schemas (if used)
│   └── data/                      # Mock / seed data and repositories
│       ├── repository.py
│       ├── hospital_data.py
│       ├── patient_data.py
│       └── staff_data.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                # Top-level routes & layout
        ├── main.jsx               # React entrypoint
        ├── index.css              # Global styling (Tailwind)
        ├── api/
        │   └── client.js          # API client / axios wrapper
        ├── pages/                 # Role-based dashboards
        │   ├── LoginPage.jsx
        │   ├── AdminDashboard.jsx
        │   ├── DoctorDashboard.jsx
        │   ├── DepartmentHeadDashboard.jsx
        │   └── PatientPortal.jsx
        └── modules/               # Feature modules (M1–M7)
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

### 1. Clone the repo
```bash
git clone https://github.com/vigneshnagarajan07/VITC-GlitchCon-HospitalDashboard.git
cd VITC-GlitchCon-HospitalDashboard
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt

# (Optional) For real AI insights, create a .env file inside `backend/` with:
# GROQ_API_KEY=your_api_key_here

uvicorn main:app --reload --port 8000
```
→ Backend: http://localhost:8000  
→ API Docs: http://localhost:8000/docs

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
→ Frontend: http://localhost:5173

---

## Roles and Access

The dashboard implements **Role-Based Access Control (RBAC)** across the stack ensuring users only see what they are authorized to view.

| Role | Responsibility & Dashboard View |
|------|--------------------------------|
| **Admin / CEO** | Hospital-wide KPIs, AI insights, revenue metrics, and predictive 48hr volume forecasts. |
| **Department Head** | Department KPIs, staff roster, surgery schedule, and active anomaly alerts for their ward. |
| **Doctor / Nurse** | Assigned patient list, OPD queues, prescribing workflows, and critical patient alerts. |
| **Floor Supervisor** | Real-time bed mapping, capacity checks, admissions, discharges, and staff present on duty. |
| **Patient Portal** | Personal timeline showing active prescriptions, pending lab reports, vitals log, and billing. |

---

## The Intelligence Engines

The core value of the platform relies on 4 interconnected intelligence services located in `backend/services/`:

1. **`kpi_engine.py`**: Computes hospital-wide averages, calculates percentage changes vs internal baselines, and generates the holistic automated 0-100 "Hospital Health Score".
2. **`anomaly_service.py`**: A deterministic rule-based engine that scans all departments against hard thresholds (e.g., Bed Occupancy > 90%, OPD wait > 30 mins) to assign Severity badges (Warning / Critical).
3. **`ai_service.py`**: Connects to the **Groq API (Llama-3 70b)**. It feeds the active anomalies and current context into a tuned prompt to generate actionable, human-readable insights. *(Has an automatic fallback to simulated insights if no API key is present, guaranteeing demo safety).*
4. **`forecasting.py`**: Calculates linear trend slopes of past workloads combined with day-of-week and time-of-day multipliers to project bed availability and wait times up to 48 hours into the future.

---

## Mock Data Simulation

All data lives in `backend/data/` inside python scripts representing our Data Access Layer. 

We have seeded intentional anomalies for the demo:
- 🔴 **Cardiology OPD wait**: 47 min (+38% above baseline of 34 min). This triggers a Critical Anomaly.
- 🔴 **General Medicine bed occupancy**: 97% (+18% above baseline of 82%). This triggers a High Severity Warning and pushes AI to suggest discharge initiations.

---

## Key Features

- ✅ **Real-time API Polling**: Frontend automatically syncs with the backend every 30 seconds to reflect metric changes dynamically.
- ✅ **LLM-Powered Insights via Groq**: Fast inference context generation providing 5 top operational instructions for the Administrator.
- ✅ **Layered Backend Architecture**: Interface endpoints (`api/routers`), Business Logic (`services/`), and Data Access (`data/`) strictly segregated for scalability.
- ✅ **Predictive Analytics**: 48-hour forward projection chart plotted with Recharts, including statistical upper/lower confidence bands.
- ✅ **Seamless Offline Fallback**: Zero external dependencies required. If Groq API keys are absent or the internet drops, the system gracefully degrades to simulated AI outputs perfectly safe for live presentations.
- ✅ **Beautiful Glassmorphic UI**: Tailored user experiences using Tailwind, custom animations, SVG gauges, and responsive Flex layouts. 

---

## Troubleshooting

**Backend not connecting**  
Make sure FastAPI is running across `http://localhost:8000`. Run: `uvicorn main:app --reload --port 8000`  
The frontend will show a connection error boundary if the backend is unreachable.

**ModuleNotFoundError: No module named 'routers'**
Ensure you are running uvicorn from *inside* the `backend/` directory, so python recognizes the project root.

**node_modules missing**  
Run `npm install` inside the `frontend/` folder.

**pip install failing on Windows**  
Try: `pip install -r requirements.txt --break-system-packages`
