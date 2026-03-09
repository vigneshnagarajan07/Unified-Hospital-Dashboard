# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# database/db.py — SQLAlchemy engine, session management & init
# ─────────────────────────────────────────────────────────────

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

# ── Database URL ──────────────────────────────────────────────
# SQLite for local dev — no extra setup required.
# Switch to PostgreSQL / MySQL by changing DATABASE_URL env var.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./primecare_hospital.db"
)

# ── Engine ────────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False,          # set True for SQL debug logs
)

# ── Session factory ───────────────────────────────────────────
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ── Dependency — FastAPI route dependency injection ────────────
def get_db() -> Session:
    """
    Yield a DB session and always close it after the request.
    Use as: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Table initialisation helper ───────────────────────────────
def init_db():
    """
    Create all tables defined in models.py if they don't exist.
    Called once at application startup.
    """
    # Import here to avoid circular imports
    from models.models import Base  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _seed_mock_data()


# ── Seed helper ───────────────────────────────────────────────
def _seed_mock_data():
    """
    Populate the database with mock data on first boot.
    Skips seeding if data already exists.
    """
    from models.models import (
        Department, User, Doctor, Patient as PatientModel,
        Bed, KPIHistory, BillingRecord, PatientFeedback,
    )
    from datetime import datetime, timedelta, date
    import random

    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(Department).count() > 0:
            return

        # ── Departments ──────────────────────────────────────
        departments = [
            Department(id="cardiology",       name="Cardiology"),
            Department(id="general_medicine", name="General Medicine"),
            Department(id="orthopedics",      name="Orthopedics"),
            Department(id="pediatrics",       name="Pediatrics"),
            Department(id="emergency",        name="Emergency"),
            Department(id="obstetrics",       name="Obstetrics & Gynaecology"),
            Department(id="administration",   name="Administration"),
        ]
        db.add_all(departments)
        db.flush()

        # ── Users (admin + dept heads) ───────────────────────
        users = [
            User(id="USR_ADM001", name="Arvind Kumar",       email="admin@primecare.in",
                 role="admin",          department_id="administration"),
            User(id="USR_DOC001", name="Dr. Ramesh Iyer",    email="ramesh@primecare.in",
                 role="department_head",department_id="cardiology"),
            User(id="USR_DOC002", name="Dr. Priya Subramaniam", email="priya@primecare.in",
                 role="department_head",department_id="general_medicine"),
            User(id="USR_DOC003", name="Dr. Karthik Menon",  email="karthik@primecare.in",
                 role="department_head",department_id="orthopedics"),
            User(id="USR_DOC004", name="Dr. Anitha Krishnan",email="anitha@primecare.in",
                 role="department_head",department_id="pediatrics"),
            User(id="USR_DOC005", name="Dr. Vijay Nair",     email="vijay@primecare.in",
                 role="department_head",department_id="emergency"),
            User(id="USR_DOC006", name="Dr. Meena Rajagopalan", email="meena@primecare.in",
                 role="department_head",department_id="obstetrics"),
            User(id="USR_PAT001", name="Senthil Kumar",      email="senthil@example.com",
                 role="patient",        department_id="cardiology"),
            User(id="USR_PAT002", name="Lakshmi Devi",       email="lakshmi@example.com",
                 role="patient",        department_id="obstetrics"),
            User(id="USR_PAT003", name="Arjun Sharma",       email="arjun@example.com",
                 role="patient",        department_id="orthopedics"),
        ]
        db.add_all(users)
        db.flush()

        # ── Doctors ───────────────────────────────────────────
        doctors = [
            Doctor(id="DOC001", user_id="USR_DOC001", department_id="cardiology",       availability_status="available"),
            Doctor(id="DOC002", user_id="USR_DOC002", department_id="general_medicine", availability_status="available"),
            Doctor(id="DOC003", user_id="USR_DOC003", department_id="orthopedics",      availability_status="available"),
            Doctor(id="DOC004", user_id="USR_DOC004", department_id="pediatrics",       availability_status="available"),
            Doctor(id="DOC005", user_id="USR_DOC005", department_id="emergency",        availability_status="on_leave"),
            Doctor(id="DOC006", user_id="USR_DOC006", department_id="obstetrics",       availability_status="available"),
        ]
        db.add_all(doctors)
        db.flush()

        # ── Patients ──────────────────────────────────────────
        patients_data = [
            PatientModel(id="PAT001", user_id="USR_PAT001", medical_record_id="MR-2024-0847"),
            PatientModel(id="PAT002", user_id="USR_PAT002", medical_record_id="MR-2024-0901"),
            PatientModel(id="PAT003", user_id="USR_PAT003", medical_record_id="MR-2024-0923"),
        ]
        db.add_all(patients_data)
        db.flush()

        # ── Beds ──────────────────────────────────────────────
        wards = {
            "cardiology":       ("Ward 3A", 60, 47),
            "general_medicine": ("Ward 2B", 120, 116),
            "orthopedics":      ("Ward 4A", 50, 33),
            "pediatrics":       ("Ward 1C", 70, 50),
            "emergency":        ("Ward GD", 40, 35),
            "obstetrics":       ("Ward 5B", 55, 38),
        }
        for dept_id, (ward, total, occupied) in wards.items():
            for bed_num in range(1, total + 1):
                bed = Bed(
                    ward=ward,
                    occupied=(bed_num <= occupied),
                    patient_id="PAT001" if (dept_id == "cardiology" and bed_num == 1) else None,
                )
                db.add(bed)
        db.flush()

        # ── KPI History — last 7 days ─────────────────────────
        bed_occupancy_trend   = [74, 76, 72, 78, 80, 77, 79]
        opd_wait_trend        = [19, 21, 20, 24, 23, 25, 22]
        billing_trend         = [87, 85, 88, 84, 86, 83, 85]
        lab_tat_trend         = [4.2, 4.5, 4.1, 4.8, 4.6, 4.3, 4.7]
        nps_trend             = [62, 58, 65, 60, 63, 61, 59]

        for day_offset in range(7):
            record_date = date.today() - timedelta(days=6 - day_offset)
            kpi = KPIHistory(
                department_id="cardiology",
                date=record_date,
                bed_occupancy=bed_occupancy_trend[day_offset],
                opd_wait_time=opd_wait_trend[day_offset],
                billing_collection_rate=billing_trend[day_offset],
                lab_tat=lab_tat_trend[day_offset],
                nps=nps_trend[day_offset],
            )
            db.add(kpi)

        # ── Billing Records ───────────────────────────────────
        billing_records = [
            BillingRecord(patient_id="PAT001", billed_amount=225000, collected_amount=180000),
            BillingRecord(patient_id="PAT002", billed_amount=102000, collected_amount=80000),
            BillingRecord(patient_id="PAT003", billed_amount=510000, collected_amount=400000),
        ]
        db.add_all(billing_records)

        # ── Patient Feedback ──────────────────────────────────
        feedbacks = [
            PatientFeedback(patient_id="PAT001", rating=4, comment="Good care, a bit of waiting time."),
            PatientFeedback(patient_id="PAT002", rating=5, comment="Excellent service by all staff."),
            PatientFeedback(patient_id="PAT003", rating=4, comment="Very professional team."),
        ]
        db.add_all(feedbacks)

        db.commit()
        print("[DB] Mock data seeded successfully.")

    except SQLAlchemyError as e:
        db.rollback()
        print(f"[DB] Seeding error: {e}")
    finally:
        db.close()
