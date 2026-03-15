# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# database/db.py — SQLAlchemy engine, session management & init
# UPDATED: Creates workflow tables + seeds nurses on startup
# ─────────────────────────────────────────────────────────────

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./primecare_hospital.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and seed initial data."""
    # Existing models
    from models.models import Base as MainBase
    MainBase.metadata.create_all(bind=engine)

    # Plugin/admin models (PatientMgmt, PatientVitals, KpiMetric, UserAuth)
    from database.models import Base as PluginBase
    PluginBase.metadata.create_all(bind=engine)

    # Workflow models (new tables)
    from models.workflow_models import Base as WorkflowBase
    WorkflowBase.metadata.create_all(bind=engine)

    # Seed original mock data
    _seed_mock_data()

    # Seed nurses
    db = SessionLocal()
    try:
        from services.workflow_service import seed_nurses
        seed_nurses(db)
        print("[DB] Nurses seeded.")
    except Exception as e:
        print(f"[DB] Nurse seed error: {e}")
    finally:
        db.close()


def _seed_mock_data():
    from models.models import (
        Department, User, Doctor, Patient as PatientModel,
        Bed, KPIHistory, BillingRecord, PatientFeedback,
    )
    from datetime import datetime, timedelta, date
    import random

    db = SessionLocal()
    try:
        if db.query(Department).count() > 0:
            return

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

        users = [
            User(id="USR_ADM001", name="Arvind Kumar",          email="admin@primecare.in",    role="admin",           department_id="administration",  username="admin",    password_hash=pwd_context.hash("admin123")),
            User(id="USR_DOC001", name="Dr. Ramesh Iyer",       email="ramesh@primecare.in",   role="department_head", department_id="cardiology",       username="doctor",   password_hash=pwd_context.hash("doctor123")),
            User(id="USR_DOC002", name="Dr. Priya Subramaniam", email="priya@primecare.in",    role="department_head", department_id="general_medicine", username="depthead", password_hash=pwd_context.hash("depthead123")),
            User(id="USR_DOC003", name="Dr. Karthik Menon",     email="karthik@primecare.in",  role="department_head", department_id="orthopedics"),
            User(id="USR_DOC004", name="Dr. Anitha Krishnan",   email="anitha@primecare.in",   role="department_head", department_id="pediatrics"),
            User(id="USR_DOC005", name="Dr. Vijay Nair",        email="vijay@primecare.in",    role="department_head", department_id="emergency"),
            User(id="USR_DOC006", name="Dr. Meena Rajagopalan", email="meena@primecare.in",    role="department_head", department_id="obstetrics",       username="floor",    password_hash=pwd_context.hash("floor123")),
            User(id="USR_PAT001", name="Senthil Kumar",         email="senthil@example.com",   role="patient",         department_id="cardiology",       username="patient",  password_hash=pwd_context.hash("patient123")),
            User(id="USR_PHR001", name="PrimeCare Pharmacy",    email="pharmacy@primecare.in", role="pharmacy",        department_id="administration",   username="pharmacy", password_hash=pwd_context.hash("pharmacy123")),
            User(id="USR_NUR001", name="Ms. Geetha Lakshmi",    email="nurse@primecare.in",    role="nurse",           department_id="cardiology",       username="nurse",    password_hash=pwd_context.hash("nurse123")),
        ]
        db.add_all(users)
        db.flush()

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

        patients_data = [
            PatientModel(id="PAT001", user_id="USR_PAT001", medical_record_id="MR-2024-0847"),
        ]
        db.add_all(patients_data)
        db.flush()

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
                bed = Bed(ward=ward, occupied=(bed_num <= occupied), patient_id="PAT001" if (dept_id == "cardiology" and bed_num == 1) else None)
                db.add(bed)
        db.flush()

        # 30-day KPI history for all departments
        dept_kpi_baselines = {
            "cardiology":       dict(bed_occ=78, wait=34, collection=86, lab_tat=4.2, nps=72),
            "general_medicine": dict(bed_occ=96, wait=28, collection=80, lab_tat=3.8, nps=68),
            "orthopedics":      dict(bed_occ=66, wait=22, collection=88, lab_tat=5.1, nps=74),
            "pediatrics":       dict(bed_occ=71, wait=18, collection=91, lab_tat=3.2, nps=81),
            "emergency":        dict(bed_occ=87, wait=42, collection=74, lab_tat=2.8, nps=65),
            "obstetrics":       dict(bed_occ=69, wait=15, collection=93, lab_tat=3.5, nps=85),
        }
        for dept_id, baseline in dept_kpi_baselines.items():
            for day_offset in range(30):
                record_date = date.today() - timedelta(days=29 - day_offset)
                noise = lambda b, pct: round(b + random.uniform(-b * pct, b * pct), 1)
                # Inject realistic anomaly in last 3 days for cardiology
                anomaly = (dept_id == "cardiology" and day_offset >= 27)
                db.add(KPIHistory(
                    department_id           = dept_id,
                    date                    = record_date,
                    bed_occupancy           = noise(baseline["bed_occ"] + (8 if anomaly else 0), 0.04),
                    opd_wait_time           = noise(baseline["wait"] + (13 if anomaly else 0), 0.06),
                    billing_collection_rate = noise(baseline["collection"], 0.03),
                    lab_tat                 = noise(baseline["lab_tat"], 0.08),
                    nps                     = noise(baseline["nps"], 0.05),
                ))

        billing_records = [
            BillingRecord(patient_id="PAT001", billed_amount=225000, collected_amount=180000),
        ]
        db.add_all(billing_records)
        db.add(PatientFeedback(patient_id="PAT001", rating=4, comment="Good care, a bit of waiting time."))

        db.commit()
        print("[DB] Mock data seeded successfully.")

    except SQLAlchemyError as e:
        db.rollback()
        print(f"[DB] Seeding error: {e}")
    finally:
        db.close()
