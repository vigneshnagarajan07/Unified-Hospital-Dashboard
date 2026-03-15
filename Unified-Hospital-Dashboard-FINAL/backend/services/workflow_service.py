# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# services/workflow_service.py — DB-backed workflow operations
#
# All in-memory dicts replaced with SQLite via SQLAlchemy.
# Every action persists and is visible across all roles.
# ─────────────────────────────────────────────────────────────

import json
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.workflow_models import (
    WorkflowPatient, Nurse, NurseAssignment,
    VitalsLog, DiagnosisRecord, PharmacyOrder,
    BillingTransaction, WorkflowNotification
)


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def _gen_patient_id(db: Session) -> str:
    count = db.query(WorkflowPatient).count()
    return f"APL-WF-{1100 + count:04d}"

def _gen_order_id() -> str:
    return f"RX-{datetime.now().strftime('%H%M%S')}-{str(uuid.uuid4())[:4].upper()}"

def _dept_name(dept_id: str) -> str:
    mapping = {
        "cardiology":       "Cardiology",
        "general_medicine": "General Medicine",
        "orthopedics":      "Orthopedics",
        "pediatrics":       "Pediatrics",
        "emergency":        "Emergency",
        "obstetrics":       "Obstetrics & Gynaecology",
    }
    return mapping.get(dept_id, dept_id.replace("_", " ").title())

def _push_notification(db: Session, role: str, message: str, urgency: str = "info"):
    notif = WorkflowNotification(role=role, message=message, urgency=urgency)
    db.add(notif)
    # Keep only last 100 notifications per role
    old = (
        db.query(WorkflowNotification)
        .filter(WorkflowNotification.role == role)
        .order_by(WorkflowNotification.created_at.asc())
        .all()
    )
    if len(old) > 100:
        for n in old[:-100]:
            db.delete(n)

def _add_billing(db: Session, patient_id: str, patient_name: str, description: str, amount: float, category: str):
    db.add(BillingTransaction(
        patient_id   = patient_id,
        patient_name = patient_name,
        description  = description,
        amount       = amount,
        category     = category,
    ))


# ─────────────────────────────────────────────────────────────
# 1. Admit Patient
# ─────────────────────────────────────────────────────────────

def admit_patient(db: Session, data: dict) -> dict:
    patient_id  = _gen_patient_id(db)
    admitted_at = datetime.now()
    dept_name   = _dept_name(data.get("department_id", ""))

    patient = WorkflowPatient(
        patient_id         = patient_id,
        name               = data["name"],
        age                = data.get("age"),
        gender             = data.get("gender", ""),
        blood_group        = data.get("blood_group", "Unknown"),
        phone              = data.get("phone", ""),
        address            = data.get("address", ""),
        department_id      = data.get("department_id", ""),
        department_name    = dept_name,
        assigned_doctor    = data.get("assigned_doctor", ""),
        assigned_doctor_id = data.get("assigned_doctor_id", ""),
        ward               = data.get("ward", ""),
        chief_complaint    = data.get("chief_complaint", ""),
        insurance_provider = data.get("insurance_provider", "None"),
        admission_date     = admitted_at.strftime("%Y-%m-%d"),
        expected_discharge = (admitted_at + timedelta(days=3)).strftime("%Y-%m-%d"),
        status             = "admitted",
    )
    db.add(patient)
    db.flush()

    # Initial room charge
    _add_billing(db, patient_id, data["name"], "Room Charges (Day 1)", 2000.0, "room")

    # Notifications
    _push_notification(db, "doctor",
        f"New patient admitted: {data['name']} ({data.get('age')}y {data.get('gender')}) — {dept_name}. Complaint: {data.get('chief_complaint') or 'Not specified'}",
        "info")
    _push_notification(db, "nurse",
        f"New patient {data['name']} admitted to {dept_name}. ID: {patient_id}. Awaiting nurse assignment.",
        "info")
    _push_notification(db, "floor_supervisor",
        f"Patient {data['name']} admitted. ID: {patient_id}",
        "info")

    db.commit()

    return {
        "status":     "admitted",
        "patient_id": patient_id,
        "patient":    _patient_to_dict(patient),
        "message":    f"{data['name']} admitted. Doctor and nurse notified.",
        "timestamp":  admitted_at.isoformat(),
    }


# ─────────────────────────────────────────────────────────────
# 2. Record Vitals (Nurse)
# ─────────────────────────────────────────────────────────────

def record_vitals(db: Session, patient_id: str, data: dict, nurse_id: int = None) -> dict:
    patient = db.query(WorkflowPatient).filter(WorkflowPatient.patient_id == patient_id).first()
    if not patient:
        return None

    # Check for critical values
    alerts = []
    bp_str  = data.get("blood_pressure", "")
    pulse   = data.get("pulse_bpm", 0)
    spo2    = data.get("spo2_pct", 100)
    temp    = data.get("temperature_f", 98.6)

    if spo2 < 90:
        alerts.append({"type": "critical", "message": f"SpO₂ critically low: {spo2}%"})
    elif spo2 < 95:
        alerts.append({"type": "warning",  "message": f"SpO₂ below normal: {spo2}%"})
    if pulse > 120 or pulse < 50:
        alerts.append({"type": "critical", "message": f"Abnormal heart rate: {pulse} bpm"})
    if temp > 103:
        alerts.append({"type": "critical", "message": f"High fever: {temp}°F"})
    elif temp > 100.4:
        alerts.append({"type": "warning",  "message": f"Elevated temperature: {temp}°F"})
    try:
        systolic = int(bp_str.split("/")[0])
        if systolic > 180:
            alerts.append({"type": "critical", "message": f"Hypertensive crisis: BP {bp_str}"})
        elif systolic < 90:
            alerts.append({"type": "critical", "message": f"Hypotension: BP {bp_str}"})
    except Exception:
        pass

    has_critical = any(a["type"] == "critical" for a in alerts)

    vitals = VitalsLog(
        patient_id       = patient_id,
        nurse_id         = nurse_id,
        blood_pressure   = bp_str,
        pulse_bpm        = pulse,
        temperature_f    = temp,
        spo2_pct         = spo2,
        weight_kg        = data.get("weight_kg"),
        respiration_rate = data.get("respiration_rate"),
        notes            = data.get("notes", ""),
        has_alerts       = has_critical,
        alert_details    = json.dumps(alerts),
        recorded_by      = data.get("recorded_by", "Nurse"),
    )
    db.add(vitals)

    # Update patient critical flag
    if has_critical:
        patient.is_critical = True

    urgency = "critical" if has_critical else "info"
    msg     = f"{'⚠ CRITICAL VITALS — ' if has_critical else 'Vitals recorded for '}{patient.name}: BP {bp_str}, SpO₂ {spo2}%, Pulse {pulse}bpm"

    _push_notification(db, "doctor",          msg, urgency)
    _push_notification(db, "floor_supervisor", msg, urgency)

    db.commit()

    return {
        "status":       "recorded",
        "patient_id":   patient_id,
        "patient_name": patient.name,
        "vitals": {
            "blood_pressure":   bp_str,
            "pulse_bpm":        pulse,
            "temperature_f":    temp,
            "spo2_pct":         spo2,
            "recorded_at":      datetime.now().isoformat(),
            "alerts":           alerts,
        },
        "has_critical": has_critical,
        "alerts":       alerts,
        "message":      f"Vitals saved. {'⚠ Doctor alerted!' if has_critical else 'Doctor notified.'}",
    }


# ─────────────────────────────────────────────────────────────
# 3. Doctor Diagnoses + Prescribes
# ─────────────────────────────────────────────────────────────

def diagnose_patient(db: Session, patient_id: str, data: dict) -> dict:
    patient = db.query(WorkflowPatient).filter(WorkflowPatient.patient_id == patient_id).first()
    if not patient:
        return None

    medications = data.get("medications", [])
    lab_tests   = data.get("lab_tests", [])

    diagnosis = DiagnosisRecord(
        patient_id   = patient_id,
        diagnosis    = data["diagnosis"],
        severity     = data.get("severity", "moderate"),
        notes        = data.get("notes", ""),
        medications  = json.dumps(medications),
        lab_tests    = json.dumps(lab_tests),
        diagnosed_by = data.get("diagnosed_by", "Doctor"),
    )
    db.add(diagnosis)

    # Update patient
    patient.diagnosis   = data["diagnosis"]
    patient.is_critical = data.get("severity") == "critical"

    # Create pharmacy orders
    order_ids = []
    for med in medications:
        order_id = _gen_order_id()
        order = PharmacyOrder(
            order_id     = order_id,
            patient_id   = patient_id,
            patient_name = patient.name,
            department   = patient.department_name,
            medication   = med.get("name", ""),
            dose         = med.get("dose", ""),
            frequency    = med.get("frequency", ""),
            duration     = med.get("duration", ""),
            instructions = med.get("instructions", ""),
            ordered_by   = data.get("diagnosed_by", "Doctor"),
            amount       = 450.0,
        )
        db.add(order)
        order_ids.append(order_id)
        _add_billing(db, patient_id, patient.name, f"Medication: {med.get('name', '')}", 450.0, "pharmacy")

    # Doctor fee
    _add_billing(db, patient_id, patient.name, "Doctor Consultation Fee", 1500.0, "doctor")

    # Lab charges
    for test in lab_tests:
        _add_billing(db, patient_id, patient.name, f"Lab: {test}", 800.0, "lab")

    # Notifications
    _push_notification(db, "patient",
        f"Your diagnosis is ready: {data['diagnosis']}. Prescriptions sent to pharmacy.",
        "info")
    if medications:
        med_names = ", ".join(m.get("name", "") for m in medications[:3])
        _push_notification(db, "pharmacy",
            f"New prescription for {patient.name}: {med_names}{'...' if len(medications) > 3 else ''}. {len(medications)} items pending.",
            "info")
    _push_notification(db, "admin",
        f"Doctor fees billed for {patient.name} ({data['diagnosis']}). Bill updated.",
        "info")
    _push_notification(db, "nurse",
        f"Diagnosis confirmed for {patient.name}: {data['diagnosis']}. Administer medications as prescribed.",
        "info")

    db.commit()

    return {
        "status":                 "diagnosed",
        "patient_id":             patient_id,
        "patient_name":           patient.name,
        "diagnosis":              data["diagnosis"],
        "medications_prescribed": len(medications),
        "pharmacy_orders":        order_ids,
        "lab_tests_ordered":      lab_tests,
        "message":                f"Diagnosis saved. {len(medications)} prescriptions sent to pharmacy.",
    }


# ─────────────────────────────────────────────────────────────
# 4. Assign Nurse to Patient (Floor Supervisor)
# ─────────────────────────────────────────────────────────────

def assign_nurse(db: Session, nurse_id: int, patient_id: str, assigned_by: str = "Floor Supervisor", notes: str = "") -> dict:
    nurse   = db.query(Nurse).filter(Nurse.id == nurse_id).first()
    patient = db.query(WorkflowPatient).filter(WorkflowPatient.patient_id == patient_id).first()

    if not nurse or not patient:
        return None

    # Remove any existing active assignment for this patient
    existing = (
        db.query(NurseAssignment)
        .filter(NurseAssignment.patient_id == patient_id, NurseAssignment.active == True)
        .all()
    )
    for a in existing:
        a.active = False

    # Create new assignment
    assignment = NurseAssignment(
        nurse_id    = nurse_id,
        patient_id  = patient_id,
        assigned_by = assigned_by,
        notes       = notes,
        active      = True,
    )
    db.add(assignment)

    # Update patient
    patient.assigned_nurse_id = nurse_id

    _push_notification(db, "nurse",
        f"You have been assigned to patient {patient.name} ({patient_id}) in {patient.department_name}. Please record vitals.",
        "info")
    _push_notification(db, "floor_supervisor",
        f"{nurse.name} assigned to {patient.name} ({patient_id}).",
        "info")

    db.commit()

    return {
        "status":       "assigned",
        "nurse_id":     nurse_id,
        "nurse_name":   nurse.name,
        "patient_id":   patient_id,
        "patient_name": patient.name,
        "message":      f"{nurse.name} assigned to {patient.name}.",
    }


# ─────────────────────────────────────────────────────────────
# 5. Dispense Medication (Pharmacy)
# ─────────────────────────────────────────────────────────────

def dispense_order(db: Session, order_id: str, dispensed_by: str = "Pharmacist", notes: str = "") -> dict:
    order = db.query(PharmacyOrder).filter(PharmacyOrder.order_id == order_id).first()
    if not order:
        return None
    if order.status == "dispensed":
        return {"error": "Already dispensed"}

    order.status       = "dispensed"
    order.dispensed_by = dispensed_by
    order.dispensed_at = datetime.now()
    order.notes        = notes

    # Check if all orders for this patient are dispensed
    patient_orders = db.query(PharmacyOrder).filter(PharmacyOrder.patient_id == order.patient_id).all()
    all_done       = all(o.status == "dispensed" for o in patient_orders)

    _push_notification(db, "patient",
        f"Your medication '{order.medication} {order.dose}' has been dispensed and is ready for collection.",
        "info")
    if all_done:
        _push_notification(db, "doctor",
            f"All medications dispensed for {order.patient_name}.",
            "info")
        _push_notification(db, "nurse",
            f"All medications ready for {order.patient_name}. Please administer as prescribed.",
            "info")

    db.commit()

    return {
        "status":       "dispensed",
        "order_id":     order_id,
        "medication":   order.medication,
        "patient_name": order.patient_name,
        "dispensed_by": dispensed_by,
        "all_done":     all_done,
        "message":      f"{order.medication} dispensed to {order.patient_name}.",
    }


# ─────────────────────────────────────────────────────────────
# 6. Discharge Patient
# ─────────────────────────────────────────────────────────────

def discharge_patient(db: Session, patient_id: str, data: dict) -> dict:
    patient = db.query(WorkflowPatient).filter(WorkflowPatient.patient_id == patient_id).first()
    if not patient:
        return None

    patient.status        = "discharged"
    patient.discharge_date = datetime.now().strftime("%Y-%m-%d")
    if data.get("final_diagnosis"):
        patient.diagnosis = data["final_diagnosis"]

    # Final billing
    billing = db.query(BillingTransaction).filter(BillingTransaction.patient_id == patient_id).all()
    total   = sum(b.amount for b in billing)
    ins_pct = 0.7 if patient.insurance_provider and patient.insurance_provider != "None" else 0.0
    ins_covered = round(total * ins_pct, 2)
    patient_due = round(total - ins_covered, 2)

    _push_notification(db, "patient",
        f"You have been discharged. Follow-up: {data.get('followup_date') or 'As advised'}. Total bill: ₹{total:,.0f}",
        "info")
    _push_notification(db, "admin",
        f"Patient {patient.name} discharged. Bill: ₹{total:,.0f} (Ins: ₹{ins_covered:,.0f} | Due: ₹{patient_due:,.0f})",
        "info")
    _push_notification(db, "pharmacy",
        f"Patient {patient.name} discharged. Final bill generated: ₹{total:,.0f}",
        "info")

    db.commit()

    return {
        "status":            "discharged",
        "patient_id":        patient_id,
        "patient_name":      patient.name,
        "final_bill":        total,
        "insurance_covered": ins_covered,
        "patient_due":       patient_due,
        "message":           f"{patient.name} discharged. Bill finalized.",
    }


# ─────────────────────────────────────────────────────────────
# 7. Seed Default Nurses
# ─────────────────────────────────────────────────────────────

def seed_nurses(db: Session):
    if db.query(Nurse).count() > 0:
        return

    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

    nurses = [
        Nurse(name="Ms. Geetha Lakshmi",    employee_id="NUR001", department_id="cardiology",       department_name="Cardiology",       shift="Morning", shift_time="07:00-15:00", on_duty=True,  specialization="Cardiac Care",    contact="+91 98401 22001", username="nurse",    password_hash=pwd.hash("nurse123")),
        Nurse(name="Ms. Revathi Sundaram",   employee_id="NUR002", department_id="cardiology",       department_name="Cardiology",       shift="Evening", shift_time="15:00-23:00", on_duty=True,  specialization="General Nursing", contact="+91 98401 33001", username="nurse2",   password_hash=pwd.hash("nurse123")),
        Nurse(name="Ms. Ananya Krishnan",    employee_id="NUR003", department_id="general_medicine", department_name="General Medicine", shift="Morning", shift_time="07:00-15:00", on_duty=True,  specialization="Internal Medicine",contact="+91 98401 44001", username="nurse3",   password_hash=pwd.hash("nurse123")),
        Nurse(name="Ms. Preethi Rajan",      employee_id="NUR004", department_id="orthopedics",      department_name="Orthopedics",      shift="Morning", shift_time="07:00-15:00", on_duty=True,  specialization="Ortho Care",      contact="+91 98401 55001", username="nurse4",   password_hash=pwd.hash("nurse123")),
        Nurse(name="Ms. Kavitha Nair",       employee_id="NUR005", department_id="pediatrics",       department_name="Pediatrics",       shift="Morning", shift_time="07:00-15:00", on_duty=True,  specialization="Pediatric Care",  contact="+91 98401 66001", username="nurse5",   password_hash=pwd.hash("nurse123")),
        Nurse(name="Ms. Divya Subramaniam",  employee_id="NUR006", department_id="emergency",        department_name="Emergency",        shift="Morning", shift_time="07:00-19:00", on_duty=True,  specialization="Emergency Care",  contact="+91 98401 77001", username="nurse6",   password_hash=pwd.hash("nurse123")),
        Nurse(name="Ms. Saranya Balamurugan",employee_id="NUR007", department_id="obstetrics",       department_name="Obstetrics",       shift="Morning", shift_time="07:00-15:00", on_duty=True,  specialization="Midwifery",       contact="+91 98401 88001", username="nurse7",   password_hash=pwd.hash("nurse123")),
        Nurse(name="Ms. Meena Pillai",       employee_id="NUR008", department_id="general_medicine", department_name="General Medicine", shift="Night",   shift_time="23:00-07:00", on_duty=False, specialization="General Nursing", contact="+91 98401 99001", username="nurse8",   password_hash=pwd.hash("nurse123")),
    ]
    db.add_all(nurses)
    db.commit()


# ─────────────────────────────────────────────────────────────
# Read helpers
# ─────────────────────────────────────────────────────────────

def get_all_workflow_patients(db: Session, status: str = None) -> list:
    q = db.query(WorkflowPatient)
    if status:
        q = q.filter(WorkflowPatient.status == status)
    return [_patient_to_dict(p) for p in q.order_by(WorkflowPatient.created_at.desc()).all()]


def get_workflow_patient(db: Session, patient_id: str) -> dict:
    p = db.query(WorkflowPatient).filter(WorkflowPatient.patient_id == patient_id).first()
    return _patient_to_dict(p) if p else None


def get_patient_vitals(db: Session, patient_id: str) -> list:
    logs = (
        db.query(VitalsLog)
        .filter(VitalsLog.patient_id == patient_id)
        .order_by(VitalsLog.recorded_at.desc())
        .all()
    )
    return [_vitals_to_dict(v) for v in logs]


def get_pharmacy_queue(db: Session, status: str = None) -> list:
    q = db.query(PharmacyOrder)
    if status and status != "all":
        q = q.filter(PharmacyOrder.status == status)
    orders = q.order_by(PharmacyOrder.ordered_at.desc()).all()
    return [_order_to_dict(o) for o in orders]


def get_billing_summary(db: Session) -> dict:
    from data.hospital_data import APOLLO_FINANCE
    patients  = db.query(WorkflowPatient).all()
    all_txns  = db.query(BillingTransaction).order_by(BillingTransaction.recorded_at.desc()).all()

    total_billed  = sum(t.amount for t in all_txns)
    by_category   = {}
    for t in all_txns:
        by_category[t.category] = by_category.get(t.category, 0) + t.amount

    return {
        "active_patients":    sum(1 for p in patients if p.status == "admitted"),
        "discharged_patients":sum(1 for p in patients if p.status == "discharged"),
        "total_billed_inr":   round(total_billed, 2),
        "revenue_by_category":{k: round(v, 2) for k, v in by_category.items()},
        "recent_transactions":[_txn_to_dict(t) for t in all_txns[:20]],
        "hospital_finance":   APOLLO_FINANCE,
        "pharmacy_orders": {
            "total":     db.query(PharmacyOrder).count(),
            "pending":   db.query(PharmacyOrder).filter(PharmacyOrder.status == "pending").count(),
            "dispensed": db.query(PharmacyOrder).filter(PharmacyOrder.status == "dispensed").count(),
        }
    }


def get_notifications(db: Session, role: str = None, unread_only: bool = False) -> list:
    q = db.query(WorkflowNotification)
    if role:
        q = q.filter(WorkflowNotification.role == role)
    if unread_only:
        q = q.filter(WorkflowNotification.read == False)
    notifs = q.order_by(WorkflowNotification.created_at.desc()).limit(50).all()
    return [_notif_to_dict(n) for n in notifs]


def mark_notification_read(db: Session, notif_id: int):
    n = db.query(WorkflowNotification).filter(WorkflowNotification.id == notif_id).first()
    if n:
        n.read = True
        db.commit()


def get_all_nurses(db: Session) -> list:
    nurses = db.query(Nurse).all()
    return [_nurse_to_dict(n) for n in nurses]


def get_nurse_patients(db: Session, nurse_id: int) -> list:
    patients = db.query(WorkflowPatient).filter(
        WorkflowPatient.assigned_nurse_id == nurse_id,
        WorkflowPatient.status == "admitted"
    ).all()
    return [_patient_to_dict(p) for p in patients]


def get_patient_billing(db: Session, patient_id: str) -> dict:
    patient = db.query(WorkflowPatient).filter(WorkflowPatient.patient_id == patient_id).first()
    txns    = db.query(BillingTransaction).filter(BillingTransaction.patient_id == patient_id).all()
    total   = sum(t.amount for t in txns)
    ins_pct = 0.7 if patient and patient.insurance_provider and patient.insurance_provider != "None" else 0.0
    return {
        "patient_id":        patient_id,
        "patient_name":      patient.name if patient else "",
        "insurance_provider":patient.insurance_provider if patient else "None",
        "total_billed":      round(total, 2),
        "insurance_covered": round(total * ins_pct, 2),
        "patient_due":       round(total * (1 - ins_pct), 2),
        "transactions":      [_txn_to_dict(t) for t in txns],
        "is_discharged":     patient.status == "discharged" if patient else False,
    }


# ─────────────────────────────────────────────────────────────
# Serializers
# ─────────────────────────────────────────────────────────────

def _patient_to_dict(p) -> dict:
    if not p: return {}
    return {
        "patient_id":         p.patient_id,
        "name":               p.name,
        "age":                p.age,
        "gender":             p.gender,
        "blood_group":        p.blood_group,
        "phone":              p.phone,
        "department_id":      p.department_id,
        "department_name":    p.department_name,
        "assigned_doctor":    p.assigned_doctor,
        "assigned_nurse_id":  p.assigned_nurse_id,
        "ward":               p.ward,
        "chief_complaint":    p.chief_complaint,
        "insurance_provider": p.insurance_provider,
        "diagnosis":          p.diagnosis,
        "is_critical":        p.is_critical,
        "status":             p.status,
        "admission_date":     p.admission_date,
        "expected_discharge": p.expected_discharge,
        "discharge_date":     p.discharge_date,
        "created_at":         p.created_at.isoformat() if p.created_at else None,
    }

def _vitals_to_dict(v) -> dict:
    return {
        "id":               v.id,
        "patient_id":       v.patient_id,
        "blood_pressure":   v.blood_pressure,
        "pulse_bpm":        v.pulse_bpm,
        "temperature_f":    v.temperature_f,
        "spo2_pct":         v.spo2_pct,
        "weight_kg":        v.weight_kg,
        "notes":            v.notes,
        "has_alerts":       v.has_alerts,
        "alerts":           json.loads(v.alert_details) if v.alert_details else [],
        "recorded_by":      v.recorded_by,
        "recorded_at":      v.recorded_at.isoformat() if v.recorded_at else None,
    }

def _order_to_dict(o) -> dict:
    return {
        "order_id":     o.order_id,
        "patient_id":   o.patient_id,
        "patient_name": o.patient_name,
        "department":   o.department,
        "medication":   o.medication,
        "dose":         o.dose,
        "frequency":    o.frequency,
        "duration":     o.duration,
        "instructions": o.instructions,
        "ordered_by":   o.ordered_by,
        "status":       o.status,
        "amount":       o.amount,
        "dispensed_by": o.dispensed_by,
        "dispensed_at": o.dispensed_at.isoformat() if o.dispensed_at else None,
        "ordered_at":   o.ordered_at.isoformat() if o.ordered_at else None,
    }

def _txn_to_dict(t) -> dict:
    return {
        "id":           t.id,
        "patient_id":   t.patient_id,
        "patient_name": t.patient_name,
        "description":  t.description,
        "amount":       t.amount,
        "category":     t.category,
        "recorded_at":  t.recorded_at.isoformat() if t.recorded_at else None,
    }

def _notif_to_dict(n) -> dict:
    return {
        "id":         n.id,
        "role":       n.role,
        "message":    n.message,
        "urgency":    n.urgency,
        "read":       n.read,
        "timestamp":  n.created_at.isoformat() if n.created_at else None,
    }

def _nurse_to_dict(n) -> dict:
    return {
        "id":              n.id,
        "name":            n.name,
        "employee_id":     n.employee_id,
        "department_id":   n.department_id,
        "department_name": n.department_name,
        "shift":           n.shift,
        "shift_time":      n.shift_time,
        "on_duty":         n.on_duty,
        "specialization":  n.specialization,
        "contact":         n.contact,
    }
