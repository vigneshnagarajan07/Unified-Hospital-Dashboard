# PrimeCare Hospital — Unified Operations Dashboard

A full-stack hospital management system with role-based dashboards for every staff member in the clinical workflow.

![PrimeCare](https://img.shields.io/badge/PrimeCare-Hospital%20Platform-0EA5E9?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite)

---

## Overview

PrimeCare is a unified hospital operations platform built for medium-sized hospitals. It connects every role in the patient journey — from reception to discharge — through a single shared patient record. Each role has a dedicated dashboard with restricted permissions appropriate to their function.

### Patient Workflow

```
Receptionist → Floor Supervisor → Nurse → Doctor → Pharmacist → Billing
```

Every action by each role updates the same patient record in real time.

---

## Features

### Role-Based Dashboards

| Role | Dashboard | Key Features |
|---|---|---|
| **Admin / CEO** | Analytics & Finance | KPI trends, anomaly detection, revenue charts, AI insights |
| **Doctor** | Clinical | Patient list, diagnosis, prescriptions, AI report generation |
| **Department Head** | Department | Bed occupancy, staff roster, surgical schedule, KPIs |
| **Floor Supervisor** | Bed Management | Live bed map, ward allocation, nurse assignment |
| **Nurse** | Patient Care | Assigned patients, vitals recording, doctor order tracking |
| **Pharmacy** | Dispensing & Billing | Prescription queue, dispense medications, revenue summary |
| **Patient** | Health Portal | Medical records, vitals history, prescriptions, discharge checklist |

### Clinical Workflow (End-to-End)

- **Admit** — Register patient with demographics, department, doctor assignment
- **Vitals** — Nurse records BP, pulse, SpO₂, temperature with automatic critical alerts
- **Diagnose** — Doctor adds diagnosis, prescribes medications, orders lab tests
- **Pharmacy** — Pharmacist sees prescription queue, dispenses medications
- **Billing** — Auto-generated bill per transaction (room, doctor, pharmacy, lab)
- **Discharge** — Final summary, follow-up scheduling, bill finalization

### Analytics (Admin / CEO)

- 30-day KPI history per department
- Anomaly detection with deviation alerts
- AI-powered insights and recommendations (via Groq API)
- Revenue breakdown by category
- Bed occupancy trends
- 48-hour forecasting

---

## Tech Stack

### Backend
- **FastAPI** — REST API framework
- **SQLAlchemy** — ORM with SQLite (swappable to PostgreSQL)
- **Passlib / bcrypt** — Password hashing
- **Groq API** — AI insights and chatbox (optional)

### Frontend
- **React 18** — UI framework
- **Vite** — Build tool and dev server
- **Tailwind CSS** — Styling
- **Axios** — HTTP client
- **Recharts** — Analytics charts
- **Lucide React** — Icons

---

## Project Structure

```
hospital-dashboard/
├── backend/
│   ├── api/routers/          # All API endpoints
│   │   ├── auth.py           # Login
│   │   ├── workflow.py       # Clinical pipeline (15 endpoints)
│   │   ├── analytics.py      # Hospital-wide KPIs
│   │   ├── patients.py       # Patient records
│   │   ├── staff.py          # Staff + bed management
│   │   ├── kpi.py            # KPI history
│   │   └── dashboard.py      # Role dashboards
│   ├── models/
│   │   ├── models.py         # Core ORM (Users, Departments, KPIHistory)
│   │   └── workflow_models.py # Clinical ORM (Patients, Vitals, Prescriptions)
│   ├── services/
│   │   ├── workflow_service.py  # All DB-backed clinical operations
│   │   ├── ai_service.py        # Groq AI integration
│   │   └── kpi_engine.py        # KPI calculations
│   ├── database/
│   │   └── db.py             # DB init + seeding
│   ├── main.py               # FastAPI app entry point
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/            # One page per role
    │   ├── components/       # Shared components
    │   ├── modules/          # M1–M7 analytics modules
    │   └── api/client.js     # All API definitions
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Clone the repository

```bash
git clone https://github.com/vigneshnagarajan07/Unified-Hospital-Dashboard.git
cd Unified-Hospital-Dashboard
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Configure environment
cp .env.example .env
# Edit .env to add your GROQ_API_KEY for AI features

# Start the server
uvicorn main:app --reload --port 8000
```

The backend will automatically:
- Create the SQLite database (`primecare_hospital.db`)
- Seed all departments, users, nurses, and 30 days of KPI history
- Serve the API at `http://localhost:8000`
- Serve interactive API docs at `http://localhost:8000/docs`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Login Credentials

| Role | Username | Password |
|---|---|---|
| Admin / CEO | `admin` | `admin123` |
| Doctor | `doctor` | `doctor123` |
| Department Head | `depthead` | `depthead123` |
| Floor Supervisor | `floor` | `floor123` |
| Nurse | `nurse` | `nurse123` |
| Pharmacy | `pharmacy` | `pharmacy123` |
| Patient | `patient` | `patient123` |

> You can also click the role cards on the login screen to sign in instantly without typing credentials.

---

## API Reference

Base URL: `http://localhost:8000/api`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login with username + password |

### Clinical Workflow
| Method | Endpoint | Description |
|---|---|---|
| POST | `/workflow/admit` | Admit a new patient |
| POST | `/workflow/vitals/{id}` | Record patient vitals |
| POST | `/workflow/diagnose/{id}` | Doctor diagnosis + prescriptions |
| GET | `/workflow/pharmacy/queue` | Pending pharmacy orders |
| PATCH | `/workflow/pharmacy/{id}/dispense` | Dispense medication |
| POST | `/workflow/discharge/{id}` | Discharge patient |
| GET | `/workflow/patients` | All workflow patients |
| GET | `/workflow/patient/{id}/summary` | Full patient record |
| GET | `/workflow/billing/summary` | Hospital billing overview |
| GET | `/workflow/billing/patient/{id}` | Per-patient bill |
| GET | `/workflow/nurses` | Nurse roster |
| POST | `/workflow/assign-nurse` | Assign nurse to patient |
| GET | `/workflow/notifications` | Role-based notifications |

Full interactive docs available at `/docs` when the server is running.

---

## Database

The system uses **SQLite** by default — no setup required. The database is auto-created on first run.

To switch to PostgreSQL, update `DATABASE_URL` in your `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/primecare
```

### Key Tables

| Table | Description |
|---|---|
| `users` | All system users with roles |
| `workflow_patients` | Admitted patients |
| `vitals_log` | Patient vitals history |
| `diagnoses` | Doctor diagnoses |
| `pharmacy_orders` | Prescription orders |
| `billing_transactions` | Line-item billing |
| `nurses` | Nurse profiles and shift info |
| `nurse_assignments` | Nurse-to-patient assignments |
| `kpi_history` | 30-day KPI data per department |
| `workflow_notifications` | Cross-role notifications |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
# Database (SQLite default — no setup needed)
DATABASE_URL=sqlite:///./primecare_hospital.db

# Groq AI — optional, enables AI insights and chatbox
# Get a free key at https://console.groq.com
GROQ_API_KEY=

# Security
JWT_SECRET=change-this-in-production

# CORS
FRONTEND_ORIGIN=http://localhost:5173
```

---

## Hospital — PrimeCare

- **Location:** Chennai, Tamil Nadu
- **Accreditation:** NABH
- **Departments:** Cardiology, General Medicine, Orthopedics, Pediatrics, Emergency, Obstetrics & Gynaecology
- **Beds:** 395 across all departments
- **Demo data:** 30 days of realistic KPI history with injected anomalies for demonstration

---

## License

MIT License — free to use, modify, and distribute.
