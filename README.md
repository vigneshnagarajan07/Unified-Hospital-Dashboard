Dynamic Hospital Performance Dashboard

> **VITC GlitchCon 2.0 Hackathon Submission**  
> Team Auraman | SNU Chennai

AI-simulated, real-time operational intelligence for hospital performance monitoring. Single comprehensive guide for the full stack, simulation pipeline, and local deployment.

**Stack:** React + Vite + Tailwind (Frontend) | Python + FastAPI (Backend) | Rule-based AI Simulation Engine  
**Mode:** Real-time data, simulated AI insights, enterprise medical UI, role-based views.

---

## Repository Structure
```
hospital-dashboard/
├── README.md                        # This file — full project guide
├── .gitignore
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── requirements.txt
│   ├── data/
│   │   ├── __init__.py
│   │   └── hospital_data.py         # Single source of truth — all hospital data
│   └── routers/
│       ├── __init__.py
│       ├── m1_aggregation.py        # M1 — Department data aggregation
│       ├── m2_kpi.py                # M2 — KPI computation + health score
│       ├── m3_anomaly.py            # M3 — Rule-based anomaly detection
│       ├── m4_insights.py           # M4 — Simulated AI insight generation
│       ├── m5_recommendations.py    # M5 — Actionable recommendations
│       ├── m6_roles.py              # M6 — Role-based data views
│       └── m7_forecast.py           # M7 — 48hr predictive forecasting
└── frontend/
    ├── package.json
    ├── vite.config.js               # Vite proxy → backend port 8000
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                  # Module tab navigation
        ├── index.css
        ├── api/
        │   └── client.js            # Axios REST client for all modules
        └── modules/
            ├── M1_DataAggregation/  # Department cards + data table
            ├── M2_KPIEngine/        # KPI cards + sparklines + health gauge
            ├── M3_AnomalyDetection/ # Anomaly alerts + severity badges
            ├── M4_AIInsights/       # Simulated AI insight cards
            ├── M5_Recommendations/  # Actionable recommendations
            ├── M6_RoleViews/        # CEO / Cardiology Head / Floor Supervisor
            └── M7_Forecast/         # 48hr forecast chart + confidence band
```

---

## Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/vigneshnagarajan07/VITC-GlitchCon-HospitalDashboard.git
cd VITC-GlitchCon-HospitalDashboard/hospital-dashboard
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
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

### 4. Run both (two terminals)

**Terminal 1 — Backend**
```bash
cd hospital-dashboard/backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd hospital-dashboard/frontend
npm run dev
```

> No API keys or environment variables needed. Runs fully offline.

---

## Modules

| Module | Name | Description |
|--------|------|-----|-------------|
| M1 | Data Aggregation | Unified department-wise data with anomaly flagging |
| M2 | KPI Engine | Real-time KPI computation + 7-day trend sparklines + health score gauge |
| M3 | Anomaly Detection | Rule-based engine scanning all metrics against baselines |
| M4 | AI Insight Generator | Simulated AI generates 5 prioritized insights from live hospital data |
| M5 | Recommendations | Actionable recommendations with urgency levels and owner assignment |
| M6 | Role-Based Views | Tailored dashboards for CEO, Cardiology Head, Floor Supervisor |
| M7 | Predictive Forecast | 48-hour load forecasting with confidence bands |

---

## AI Simulation Engine

No external API is used. All AI behaviour is simulated in the backend using rule-based logic and pre-engineered responses tied to real anomaly data.

| Feature | How it works |
|---------|-------------|
| M4 AI Insights | 5 pre-written insights that reference actual anomalies in live data — rotated and weighted by severity |
| Ask-the-Dashboard Chatbox | Keyword-matching engine that returns contextually accurate answers about current hospital status |
| Insight "regeneration" | Cycles through an insight pool ranked by current anomaly severity |

### Why simulation over real AI?
- ✅ Zero API cost
- ✅ Zero failure risk during live demo
- ✅ Instant response — no network latency
- ✅ Fully offline — works without internet
- ✅ Responses are tailored to exact anomalies in the data

### ML-ready boundaries
All AI endpoints are designed for real ML drop-in replacement:
```
GET  /api/m4/insights      — Insight generation (swap with LLM)
POST /api/m4/chat          — Chatbox (swap with RAG pipeline)
GET  /api/m7/forecast      — Demand forecast (swap with time-series model)
GET  /api/m3/anomalies     — Anomaly detection (swap with ML model)
```

Frontend uses REST only — swap backend handlers to real ML without any frontend changes.

---

## Hospital Data -- sample data

**Apollo Hospital** · Chennai, Tamil Nadu · NABH Accredited  
All data lives in `backend/data/hospital_data.py` — single source of truth for all modules.

| Department | Beds | Occupancy | OPD Wait | Status |
|------------|------|-----------|----------|--------|
| Cardiology | 60 | 78% | 47 min ⚠️ | Warning |
| General Medicine | 120 | 97% | 22 min | 🔴 Critical |
| Orthopedics | 50 | 65% | 18 min | ✅ Normal |
| Pediatrics | 70 | 72% | 15 min | ✅ Normal |
| Emergency | 40 | 88% | 8 min | ✅ Normal |
| Obstetrics | 55 | 69% | 20 min | ✅ Normal |

**Intentional anomalies for demo:**
- 🔴 Cardiology OPD wait: 47 min (+38% above baseline of 34 min)
- 🔴 General Medicine bed occupancy: 97% (+18% above baseline of 82%)

---

## Key Features

- ✅ Real-time auto-refresh every 30 seconds
- ✅ Rule-based anomaly detection with severity badges (critical / warning / normal)
- ✅ Simulated AI insights — context-aware, anomaly-driven
- ✅ Role-based views — CEO, Department Head, Floor Supervisor
- ✅ 48-hour predictive forecasting with confidence band
- ✅ Hospital Health Score gauge (0–100, graded A/B/C/D)
- ✅ Ask-the-Dashboard chatbox with keyword-aware responses
- ✅ PDF export via browser print
- ✅ Cards + Table view toggle
- ✅ Fully offline — no internet or API keys required

---

## Roles

| Role | View |
|------|------|
| CEO | Hospital-wide KPIs, revenue metrics, anomaly summary |
| Cardiology Head | Cardiology deep-dive, OPD wait anomaly, surgeon schedule |
| Floor Supervisor | Real-time bed availability, critical patient list, staff on duty |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP | Axios |
| Backend | Python 3.11+, FastAPI, Uvicorn |
| AI | Rule-based simulation engine (no external API) |
| Data | In-memory (hospital_data.py) — no database needed |

---

## Troubleshooting

**Backend not connecting**  
Make sure FastAPI is running: `uvicorn main:app --reload --port 8000`  
The frontend shows a red error banner if the backend is unreachable.

**LF/CRLF warnings on Windows**  
These are normal on Windows — not errors. Git normalises line endings automatically.

**node_modules missing**  
Run `npm install` inside the `frontend/` folder.

**pip install failing on Windows**  
Try: `pip install -r requirements.txt --break-system-packages`

