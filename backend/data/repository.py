# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# repository.py — Data access abstraction layer
# FIX: Added bed layout, pharmacy, and per-dept trend accessors
# ─────────────────────────────────────────────────────────────

from data.hospital_data import (
    APOLLO_DEPARTMENTS,
    APOLLO_HOSPITAL_INFO,
    APOLLO_TREND_DATA,
    APOLLO_FINANCE,
    APOLLO_BED_LAYOUT,
    APOLLO_PHARMACY,
)
from data.patient_data import APOLLO_PATIENTS
from data.staff_data    import APOLLO_STAFF


# ── Hospital queries ──────────────────────────────────────────

def fetch_hospital_info():
    return APOLLO_HOSPITAL_INFO


def fetch_all_departments():
    return APOLLO_DEPARTMENTS


def fetch_department_by_id(department_id: str):
    return next(
        (dept for dept in APOLLO_DEPARTMENTS if dept["id"] == department_id),
        None
    )


def fetch_trend_data():
    return APOLLO_TREND_DATA


def fetch_finance_data():
    return APOLLO_FINANCE


def fetch_pharmacy_data():
    return APOLLO_PHARMACY


# ── Bed layout queries (NEW) ──────────────────────────────────

def fetch_all_bed_layouts():
    return APOLLO_BED_LAYOUT


def fetch_bed_layout_by_department(department_id: str):
    return APOLLO_BED_LAYOUT.get(department_id, {})


def fetch_dept_trend(department_id: str, metric: str):
    """
    Fetch per-department trend array.
    metric: 'bed_occupancy' | 'opd_wait'
    """
    key = f"dept_{metric}"
    return APOLLO_TREND_DATA.get(key, {}).get(department_id, [])


# ── Patient queries (DB-first, fallback to in-memory) ────────

def _get_db_session():
    """Get a DB session. Returns None if DB is unavailable."""
    try:
        from database.db import SessionLocal
        return SessionLocal()
    except Exception:
        return None


def _wp_to_dict(wp, db=None) -> dict:
    """Convert WorkflowPatient ORM object to the dict shape expected by the rest of the codebase.

    This preserves the exact same keys as APOLLO_PATIENTS so all downstream
    consumers (dashboard endpoints, templates, frontend API shapes) work unchanged.
    """
    import json as _json

    # Build vitals list from VitalsLog
    vitals_list = []
    if hasattr(wp, "vitals") and wp.vitals:
        for v in wp.vitals:
            vitals_list.append({
                "recorded_at":    v.recorded_at.strftime("%Y-%m-%d %H:%M") if v.recorded_at else "",
                "blood_pressure": v.blood_pressure or "",
                "pulse_bpm":      v.pulse_bpm,
                "temperature_f":  v.temperature_f,
                "spo2_pct":       v.spo2_pct,
                "weight_kg":      v.weight_kg,
            })

    # Build prescriptions from DiagnosisRecord
    prescriptions = []
    if hasattr(wp, "diagnoses") and wp.diagnoses:
        for diag in wp.diagnoses:
            meds = []
            if diag.medications:
                try:
                    meds = _json.loads(diag.medications) if isinstance(diag.medications, str) else diag.medications
                except Exception:
                    meds = []
            prescriptions.append({
                "prescribed_date": diag.diagnosed_at.strftime("%Y-%m-%d") if diag.diagnosed_at else "",
                "doctor_name":     diag.diagnosed_by or "",
                "medications":     meds,
                "notes":           diag.notes or "",
            })

    # Build bill_estimate from BillingTransaction
    bill_estimate = {}
    if hasattr(wp, "billing") and wp.billing:
        category_map = {
            "room":      "room_charges_lakh",
            "doctor":    "doctor_fees_lakh",
            "pharmacy":  "pharmacy_lakh",
            "lab":       "lab_charges_lakh",
            "procedure": "procedure_charges_lakh",
        }
        total = 0.0
        for txn in wp.billing:
            lakh_val = txn.amount / 100000
            key = category_map.get(txn.category, f"{txn.category}_lakh")
            bill_estimate[key] = round(lakh_val, 2)
            total += lakh_val
        bill_estimate["total_lakh"] = round(total, 2)
        bill_estimate["insurance_provider"] = wp.insurance_provider or ""
        bill_estimate["insurance_covered_lakh"] = round(total * 0.8, 2)
        bill_estimate["patient_due_lakh"] = round(total * 0.2, 2)
        bill_estimate["claim_status"] = "approved"

    return {
        "patient_id":         wp.patient_id,
        "name":               wp.name,
        "age":                wp.age,
        "gender":             wp.gender,
        "blood_group":        wp.blood_group,
        "phone":              wp.phone,
        "address":            wp.address,
        "department_id":      wp.department_id,
        "department_name":    wp.department_name,
        "assigned_doctor_id": wp.assigned_doctor_id,
        "assigned_doctor":    wp.assigned_doctor,
        "ward":               wp.ward,
        "bed_number":         getattr(wp, "bed_number", ""),
        "admission_date":     wp.admission_date,
        "expected_discharge": wp.expected_discharge,
        "diagnosis":          wp.diagnosis,
        "status":             wp.status,
        "is_critical":        wp.is_critical or False,
        "vitals":             vitals_list,
        "prescriptions":      prescriptions,
        "lab_reports":        [],  # lab reports stay in-memory for now
        "bill_estimate":      bill_estimate,
        "discharge_checklist": [],  # checklists stay in-memory for now
    }


def _merge_inmemory_fields(db_dict: dict, patient_id: str) -> dict:
    """Overlay lab_reports and discharge_checklist from APOLLO_PATIENTS onto the DB record."""
    inmemory = next((p for p in APOLLO_PATIENTS if p["patient_id"] == patient_id), None)
    if inmemory:
        if not db_dict.get("lab_reports"):
            db_dict["lab_reports"] = inmemory.get("lab_reports", [])
        if not db_dict.get("discharge_checklist"):
            db_dict["discharge_checklist"] = inmemory.get("discharge_checklist", [])
        if not db_dict.get("bed_number"):
            db_dict["bed_number"] = inmemory.get("bed_number", "")
    return db_dict


def fetch_all_patients():
    db = _get_db_session()
    if db:
        try:
            from models.workflow_models import WorkflowPatient
            patients = db.query(WorkflowPatient).all()
            if patients:
                result = [_merge_inmemory_fields(_wp_to_dict(p, db), p.patient_id) for p in patients]
                return result
        except Exception:
            pass
        finally:
            db.close()
    return APOLLO_PATIENTS


def fetch_patient_by_id(patient_id: str):
    db = _get_db_session()
    if db:
        try:
            from models.workflow_models import WorkflowPatient
            wp = db.query(WorkflowPatient).filter(WorkflowPatient.patient_id == patient_id).first()
            if wp:
                result = _merge_inmemory_fields(_wp_to_dict(wp, db), patient_id)
                return result
        except Exception:
            pass
        finally:
            db.close()
    return next(
        (p for p in APOLLO_PATIENTS if p["patient_id"] == patient_id),
        None
    )


def fetch_patients_by_department(department_id: str):
    db = _get_db_session()
    if db:
        try:
            from models.workflow_models import WorkflowPatient
            patients = db.query(WorkflowPatient).filter(WorkflowPatient.department_id == department_id).all()
            if patients:
                return [_merge_inmemory_fields(_wp_to_dict(p, db), p.patient_id) for p in patients]
        except Exception:
            pass
        finally:
            db.close()
    return [
        p for p in APOLLO_PATIENTS
        if p["department_id"] == department_id
    ]


def fetch_patients_by_doctor(doctor_id: str):
    db = _get_db_session()
    if db:
        try:
            from models.workflow_models import WorkflowPatient
            patients = db.query(WorkflowPatient).filter(WorkflowPatient.assigned_doctor_id == doctor_id).all()
            if patients:
                return [_merge_inmemory_fields(_wp_to_dict(p, db), p.patient_id) for p in patients]
        except Exception:
            pass
        finally:
            db.close()
    return [
        p for p in APOLLO_PATIENTS
        if p["assigned_doctor_id"] == doctor_id
    ]


def fetch_critical_patients():
    db = _get_db_session()
    if db:
        try:
            from models.workflow_models import WorkflowPatient
            patients = db.query(WorkflowPatient).filter(WorkflowPatient.is_critical == True).all()
            if patients:
                return [_merge_inmemory_fields(_wp_to_dict(p, db), p.patient_id) for p in patients]
        except Exception:
            pass
        finally:
            db.close()
    return [p for p in APOLLO_PATIENTS if p["is_critical"]]


# ── Staff queries ─────────────────────────────────────────────

def fetch_all_staff():
    return APOLLO_STAFF


def fetch_staff_by_id(staff_id: str):
    return next(
        (s for s in APOLLO_STAFF if s["staff_id"] == staff_id),
        None
    )


def fetch_staff_by_department(department_id: str):
    return [
        s for s in APOLLO_STAFF
        if s["department_id"] == department_id
    ]


def fetch_staff_on_duty():
    return [s for s in APOLLO_STAFF if s["on_duty_today"]]


def fetch_doctors_on_duty():
    return [
        s for s in APOLLO_STAFF
        if s["on_duty_today"] and s["role"] == "doctor"
    ]
