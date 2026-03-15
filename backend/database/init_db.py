# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# database/init_db.py — Create tables + seed mock KPI data
# Call init_plugin_db() from main.py startup
# ─────────────────────────────────────────────────────────────

from datetime import date, timedelta
import random

from database.db import engine, SessionLocal
from database.models import Base, UserAuth, PatientMgmt, PatientVitals, KpiMetric


def init_plugin_db():
    """Create new plugin tables and seed if empty."""
    Base.metadata.create_all(bind=engine)
    _seed()


def _seed():
    db = SessionLocal()
    try:
        # ── Skip if already seeded ────────────────────────────
        if db.query(UserAuth).count() > 0:
            return

        # ── Default admin user ────────────────────────────────
        db.add(UserAuth(username="admin", password="admin123", role="admin"))

        # ── Sample patients ───────────────────────────────────
        patients = [
            PatientMgmt(name="Senthil Kumar",   age=54, gender="Male",
                        department="Cardiology",       assigned_doctor="Dr. Ramesh Iyer",
                        diagnosis="Coronary Artery Disease", contact="9876543210",
                        admission_status="icu"),
            PatientMgmt(name="Meena Devi",       age=36, gender="Female",
                        department="Obstetrics",       assigned_doctor="Dr. Meena Rajagopalan",
                        diagnosis="Gestational Hypertension", contact="9123456789",
                        admission_status="admitted"),
            PatientMgmt(name="Arjun Sharma",     age=29, gender="Male",
                        department="Orthopedics",      assigned_doctor="Dr. Karthik Menon",
                        diagnosis="ACL Tear — Post-op", contact="9000112233",
                        admission_status="admitted"),
            PatientMgmt(name="Kavitha Rajan",    age=61, gender="Female",
                        department="General Medicine", assigned_doctor="Dr. Priya Subramaniam",
                        diagnosis="Type 2 Diabetes + Hypertension", contact="9111222333",
                        admission_status="admitted"),
            PatientMgmt(name="Venkatesh Pillai", age=72, gender="Male",
                        department="Neurology",        assigned_doctor="Dr. Anitha Krishnan",
                        diagnosis="Ischemic Stroke",   contact="9444555666",
                        admission_status="icu"),
            PatientMgmt(name="Priya Nair",       age=22, gender="Female",
                        department="Emergency",        assigned_doctor="Dr. Vijay Nair",
                        diagnosis="Acute Appendicitis", contact="9777888999",
                        admission_status="admitted"),
        ]
        db.add_all(patients)
        db.flush()

        # ── Vitals for first 3 patients ───────────────────────
        vitals = [
            PatientVitals(patient_id=patients[0].id, heart_rate=92,
                          blood_pressure="145/90", temperature=37.4,
                          oxygen_saturation=94, respiration_rate=18,
                          notes="Monitor SpO2 — pending echo"),
            PatientVitals(patient_id=patients[1].id, heart_rate=84,
                          blood_pressure="138/88", temperature=37.1,
                          oxygen_saturation=97, respiration_rate=16,
                          notes="BP stable on medication"),
            PatientVitals(patient_id=patients[2].id, heart_rate=72,
                          blood_pressure="118/76", temperature=36.9,
                          oxygen_saturation=99, respiration_rate=14,
                          notes="Post-op day 2 — mobilising"),
            PatientVitals(patient_id=patients[4].id, heart_rate=78,
                          blood_pressure="130/82", temperature=37.2,
                          oxygen_saturation=96, respiration_rate=17,
                          notes="GCS 14/15 — improving"),
        ]
        db.add_all(vitals)

        # ── 7-day KPI data per department ─────────────────────
        departments = ["Cardiology", "Orthopedics", "Neurology", "Emergency", "General Medicine"]
        today = date.today()

        # Normal baseline ranges
        base = {
            "Cardiology":       dict(bed=(75,85), wait=(22,32), bcr=(87,93), lab=(45,65), ra=(3,7),  nps=(68,78)),
            "Orthopedics":      dict(bed=(65,78), wait=(15,25), bcr=(84,92), lab=(38,55), ra=(2,5),  nps=(72,82)),
            "Neurology":        dict(bed=(70,82), wait=(18,28), bcr=(85,91), lab=(50,70), ra=(4,8),  nps=(65,75)),
            "Emergency":        dict(bed=(80,92), wait=(12,22), bcr=(78,88), lab=(35,55), ra=(5,10), nps=(60,72)),
            "General Medicine": dict(bed=(72,84), wait=(20,30), bcr=(86,94), lab=(42,62), ra=(3,7),  nps=(70,80)),
        }

        def rand(lo, hi): return round(random.uniform(lo, hi), 1)

        for dept in departments:
            b = base[dept]
            for day_offset in range(7):
                record_date = today - timedelta(days=6 - day_offset)
                is_today    = (day_offset == 6)

                # Inject anomalies on today's record
                wait = rand(*b["wait"])
                lab  = rand(*b["lab"])
                if is_today:
                    if dept == "Cardiology":
                        wait = round(b["wait"][1] * 1.46, 1)   # +46% spike
                    if dept == "Emergency":
                        lab  = round(b["lab"][1] * 1.52, 1)    # +52% TAT delay

                db.add(KpiMetric(
                    department              = dept,
                    date                    = record_date,
                    bed_occupancy           = rand(*b["bed"]),
                    opd_wait_time           = wait,
                    billing_collection_rate = rand(*b["bcr"]),
                    lab_tat                 = lab,
                    readmission_rate        = rand(*b["ra"]),
                    nps_score               = rand(*b["nps"]),
                ))

        db.commit()
        print("[Plugin DB] Seeded users, patients, KPI metrics.")

    except Exception as exc:
        db.rollback()
        print(f"[Plugin DB] Seed error: {exc}")
    finally:
        db.close()
