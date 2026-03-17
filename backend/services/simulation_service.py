# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# services/simulation_service.py — Live Data Simulation
#
# Background task that generates realistic hospital activity:
#   - Vitals fluctuations for admitted patients
#   - Occasional new admissions / discharges
#   - Revenue ticks from ongoing care
#   - Workflow notifications for critical events
#
# Runs on a configurable interval (default: 45 seconds).
# Enabled via SIMULATION_ENABLED env var (default: True).
# ─────────────────────────────────────────────────────────────

import asyncio
import json
import random
import logging
from datetime import datetime, timedelta
from contextlib import contextmanager

logger = logging.getLogger("simulation")

# ── Configuration ─────────────────────────────────────────────
SIMULATION_INTERVAL_SEC = 45
SIMULATION_ENABLED = True

# Realistic vital ranges
VITAL_RANGES = {
    "blood_pressure_sys": (100, 160),
    "blood_pressure_dia": (60, 100),
    "pulse_bpm":          (55, 120),
    "temperature_f":      (97.0, 101.5),
    "spo2_pct":           (88, 100),
}

# Names for auto-generated patients
FIRST_NAMES = ["Arun", "Priya", "Rajesh", "Deepa", "Suresh", "Kavitha",
               "Mohan", "Lakshmi", "Vijay", "Anitha", "Ganesh", "Meena",
               "Karthik", "Saranya", "Ravi", "Divya"]
LAST_NAMES  = ["Kumar", "Sharma", "Pillai", "Menon", "Iyer", "Nair",
               "Rajan", "Devi", "Singh", "Reddy", "Bhat", "Gupta"]

DEPARTMENTS = [
    {"id": "cardiology",       "name": "Cardiology",       "doctor": "Dr. Ramesh Iyer",       "doctor_id": "DOC001"},
    {"id": "general_medicine", "name": "General Medicine",  "doctor": "Dr. Priya Subramaniam", "doctor_id": "DOC002"},
    {"id": "orthopedics",      "name": "Orthopedics",       "doctor": "Dr. Karthik Menon",     "doctor_id": "DOC003"},
    {"id": "pediatrics",       "name": "Pediatrics",        "doctor": "Dr. Anitha Krishnan",   "doctor_id": "DOC004"},
    {"id": "emergency",        "name": "Emergency",         "doctor": "Dr. Vijay Nair",        "doctor_id": "DOC005"},
    {"id": "obstetrics",       "name": "Obstetrics & Gynaecology", "doctor": "Dr. Meena Rajagopalan", "doctor_id": "DOC006"},
]

CHIEF_COMPLAINTS = [
    "Chest pain radiating to left arm",
    "Persistent fever for 3 days",
    "Severe headache with nausea",
    "Shortness of breath on exertion",
    "Abdominal pain, lower right quadrant",
    "Chronic back pain, worsening",
    "High blood sugar, uncontrolled",
    "Post-surgical follow-up",
    "Allergic reaction, skin rashes",
    "Joint pain and swelling",
]


def _get_db_session():
    """Get a fresh DB session for the simulation background task."""
    from database.db import SessionLocal
    return SessionLocal()


# ── Vitals Simulation ─────────────────────────────────────────

def _simulate_vitals(db):
    """Generate slightly varied vitals for all admitted patients."""
    from models.workflow_models import WorkflowPatient, VitalsLog, WorkflowNotification

    admitted = db.query(WorkflowPatient).filter(
        WorkflowPatient.status == "admitted"
    ).all()

    if not admitted:
        return 0

    # Pick random subset (up to 5) to update vitals for
    count = min(len(admitted), random.randint(1, 5))
    selected = random.sample(admitted, count)
    updated = 0

    for patient in selected:
        # Generate realistic vitals with slight variance
        sys_bp  = random.randint(*VITAL_RANGES["blood_pressure_sys"])
        dia_bp  = random.randint(*VITAL_RANGES["blood_pressure_dia"])
        pulse   = random.randint(*VITAL_RANGES["pulse_bpm"])
        temp    = round(random.uniform(*VITAL_RANGES["temperature_f"]), 1)
        spo2    = random.randint(*VITAL_RANGES["spo2_pct"])

        # Check for critical vitals
        alerts = []
        has_critical = False
        if spo2 < 90:
            alerts.append({"type": "critical", "message": f"SpO₂ critically low: {spo2}%"})
            has_critical = True
        elif spo2 < 95:
            alerts.append({"type": "warning", "message": f"SpO₂ below normal: {spo2}%"})
        if pulse > 120 or pulse < 50:
            alerts.append({"type": "critical", "message": f"Abnormal heart rate: {pulse} bpm"})
            has_critical = True
        if temp > 103:
            alerts.append({"type": "critical", "message": f"High fever: {temp}°F"})
            has_critical = True
        if sys_bp > 180:
            alerts.append({"type": "critical", "message": f"Hypertensive crisis: {sys_bp}/{dia_bp}"})
            has_critical = True

        vitals = VitalsLog(
            patient_id     = patient.patient_id,
            blood_pressure = f"{sys_bp}/{dia_bp}",
            pulse_bpm      = pulse,
            temperature_f  = temp,
            spo2_pct       = spo2,
            has_alerts     = has_critical,
            alert_details  = json.dumps(alerts) if alerts else None,
            recorded_by    = "Auto-Monitor",
        )
        db.add(vitals)

        if has_critical:
            patient.is_critical = True
            db.add(WorkflowNotification(
                role    = "doctor",
                message = f"⚠ CRITICAL — {patient.name}: BP {sys_bp}/{dia_bp}, SpO₂ {spo2}%, Pulse {pulse}bpm",
                urgency = "critical",
            ))
            db.add(WorkflowNotification(
                role    = "nurse",
                message = f"⚠ {patient.name} requires immediate attention — vitals abnormal",
                urgency = "critical",
            ))

        updated += 1

    db.commit()
    return updated


# ── Patient Flow Simulation ───────────────────────────────────

def _simulate_admission(db):
    """Occasionally admit a new patient (roughly every 3-4 cycles ≈ 2-3 min)."""
    from models.workflow_models import WorkflowPatient, BillingTransaction, WorkflowNotification

    if random.random() > 0.3:  # 30% chance each cycle
        return None

    dept = random.choice(DEPARTMENTS)
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    age  = random.randint(18, 80)
    gender = random.choice(["Male", "Female"])
    complaint = random.choice(CHIEF_COMPLAINTS)

    count = db.query(WorkflowPatient).count()
    patient_id = f"APL-SIM-{2000 + count:04d}"

    patient = WorkflowPatient(
        patient_id         = patient_id,
        name               = name,
        age                = age,
        gender             = gender,
        blood_group        = random.choice(["A+", "B+", "O+", "AB+", "A-", "O-"]),
        phone              = f"+91 9{random.randint(1000000000, 9999999999) % 1000000000:09d}",
        department_id      = dept["id"],
        department_name    = dept["name"],
        assigned_doctor    = dept["doctor"],
        assigned_doctor_id = dept["doctor_id"],
        ward               = f"Ward — {dept['name']}",
        chief_complaint    = complaint,
        insurance_provider = random.choice(["Star Health", "HDFC Ergo", "ICICI Lombard", "None", "None"]),
        admission_date     = datetime.now().strftime("%Y-%m-%d"),
        expected_discharge = (datetime.now() + timedelta(days=random.randint(2, 7))).strftime("%Y-%m-%d"),
        status             = "admitted",
    )
    db.add(patient)
    db.flush()

    # Room charge
    db.add(BillingTransaction(
        patient_id=patient_id, patient_name=name,
        description="Room Charges (Day 1)", amount=2000.0, category="room",
    ))

    # Notifications
    db.add(WorkflowNotification(
        role="doctor",
        message=f"New patient admitted: {name} ({age}y {gender}) — {dept['name']}. Complaint: {complaint}",
        urgency="info",
    ))
    db.add(WorkflowNotification(
        role="nurse",
        message=f"New patient {name} admitted to {dept['name']}. ID: {patient_id}",
        urgency="info",
    ))

    db.commit()
    logger.info(f"[Sim] Admitted {name} → {dept['name']}")
    return patient_id


def _simulate_discharge(db):
    """Occasionally discharge a long-admitted patient."""
    from models.workflow_models import WorkflowPatient, BillingTransaction, WorkflowNotification

    if random.random() > 0.15:  # 15% chance each cycle
        return None

    # Find patients admitted > 2 minutes ago (simulating long stay)
    cutoff = datetime.utcnow() - timedelta(minutes=2)
    candidates = db.query(WorkflowPatient).filter(
        WorkflowPatient.status == "admitted",
        WorkflowPatient.created_at < cutoff,
    ).all()

    # Only discharge sim patients (APL-SIM-*), not seeded ones
    sim_candidates = [p for p in candidates if p.patient_id.startswith("APL-SIM-")]
    if not sim_candidates:
        return None

    patient = random.choice(sim_candidates)
    patient.status = "discharged"
    patient.discharge_date = datetime.now().strftime("%Y-%m-%d")

    # Final billing
    txns = db.query(BillingTransaction).filter(
        BillingTransaction.patient_id == patient.patient_id
    ).all()
    total = sum(t.amount for t in txns)

    db.add(WorkflowNotification(
        role="admin",
        message=f"Patient {patient.name} discharged. Bill: ₹{total:,.0f}",
        urgency="info",
    ))

    db.commit()
    logger.info(f"[Sim] Discharged {patient.name}")
    return patient.patient_id


# ── Revenue Simulation ────────────────────────────────────────

def _simulate_revenue_tick(db):
    """Add small billing items for ongoing care to random admitted patients."""
    from models.workflow_models import WorkflowPatient, BillingTransaction

    admitted = db.query(WorkflowPatient).filter(
        WorkflowPatient.status == "admitted"
    ).all()

    if not admitted or random.random() > 0.4:
        return 0

    patient = random.choice(admitted)
    items = [
        ("Ward monitoring fee",     150.0,  "room"),
        ("Nursing care charges",    200.0,  "room"),
        ("IV fluid administration", 350.0,  "procedure"),
        ("Blood test (routine)",    600.0,  "lab"),
        ("ECG monitoring",          400.0,  "procedure"),
        ("Oxygen therapy",          500.0,  "procedure"),
    ]
    desc, amount, cat = random.choice(items)

    db.add(BillingTransaction(
        patient_id   = patient.patient_id,
        patient_name = patient.name,
        description  = desc,
        amount       = amount,
        category     = cat,
    ))
    db.commit()
    return 1


# ── Main Simulation Loop ─────────────────────────────────────

async def run_simulation():
    """
    Main async loop. Runs on startup and repeats every SIMULATION_INTERVAL_SEC.
    Each cycle: update vitals → maybe admit → maybe discharge → revenue tick.
    """
    if not SIMULATION_ENABLED:
        logger.info("[Sim] Simulation disabled.")
        return

    logger.info(f"[Sim] Simulation started — interval: {SIMULATION_INTERVAL_SEC}s")

    # Wait a few seconds for DB to be fully ready
    await asyncio.sleep(5)

    while True:
        try:
            db = _get_db_session()
            try:
                vitals_count = _simulate_vitals(db)
                new_patient  = _simulate_admission(db)
                discharged   = _simulate_discharge(db)
                revenue      = _simulate_revenue_tick(db)

                logger.info(
                    f"[Sim] Cycle: {vitals_count} vitals | "
                    f"{'Admitted: ' + new_patient if new_patient else 'No admission'} | "
                    f"{'Discharged: ' + discharged if discharged else 'No discharge'} | "
                    f"{revenue} revenue items"
                )
            finally:
                db.close()
        except Exception as e:
            logger.error(f"[Sim] Error: {e}")

        await asyncio.sleep(SIMULATION_INTERVAL_SEC)
