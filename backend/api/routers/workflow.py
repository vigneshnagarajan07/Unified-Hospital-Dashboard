# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# api/routers/workflow.py — End-to-End Clinical Workflow API
#
# All handlers now use services/workflow_service.py (DB-backed).
# Data persists across server restarts via SQLite.
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from database.db import get_db
import services.workflow_service as svc

router = APIRouter()


# ─────────────────────────────────────────────────────────────
# Pydantic request schemas
# ─────────────────────────────────────────────────────────────

class AdmitPatientRequest(BaseModel):
    name:               str
    age:                int
    gender:             str
    blood_group:        Optional[str] = "Unknown"
    phone:              Optional[str] = ""
    address:            Optional[str] = ""
    department_id:      str
    assigned_doctor:    str
    assigned_doctor_id: str
    ward:               Optional[str] = ""
    chief_complaint:    Optional[str] = ""
    insurance_provider: Optional[str] = "None"


class VitalsRequest(BaseModel):
    patient_id:       str
    blood_pressure:   str
    pulse_bpm:        int
    temperature_f:    float
    spo2_pct:         int
    weight_kg:        Optional[float] = None
    respiration_rate: Optional[int]   = None
    recorded_by:      Optional[str]   = "Nurse"
    nurse_id:         Optional[int]   = None
    notes:            Optional[str]   = ""


class DiagnoseRequest(BaseModel):
    patient_id:   str
    diagnosis:    str
    severity:     Optional[str] = "moderate"
    notes:        Optional[str] = ""
    medications:  list = []
    lab_tests:    list = []
    diagnosed_by: Optional[str] = "Doctor"


class PharmacyDispenseRequest(BaseModel):
    dispensed_by: Optional[str] = "Pharmacist"
    notes:        Optional[str] = ""


class DischargeRequest(BaseModel):
    patient_id:        str
    discharge_summary: str
    followup_date:     Optional[str] = ""
    final_diagnosis:   Optional[str] = ""
    discharged_by:     Optional[str] = "Doctor"


class AssignNurseRequest(BaseModel):
    nurse_id:    int
    patient_id:  str
    assigned_by: Optional[str] = "Floor Supervisor"
    notes:       Optional[str] = ""


# ─────────────────────────────────────────────────────────────
# 1. Admit Patient  —  POST /api/workflow/admit
# ─────────────────────────────────────────────────────────────

@router.post("/admit")
def admit_patient(body: AdmitPatientRequest, db: Session = Depends(get_db)):
    return svc.admit_patient(db, body.dict())


# ─────────────────────────────────────────────────────────────
# 2. Record Vitals  —  POST /api/workflow/vitals/{patient_id}
# ─────────────────────────────────────────────────────────────

@router.post("/vitals/{patient_id}")
def record_vitals(patient_id: str, body: VitalsRequest, db: Session = Depends(get_db)):
    result = svc.record_vitals(db, patient_id, body.dict(), nurse_id=body.nurse_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")
    return result


# ─────────────────────────────────────────────────────────────
# 3. Get Vitals History  —  GET /api/workflow/vitals/{patient_id}
# ─────────────────────────────────────────────────────────────

@router.get("/vitals/{patient_id}")
def get_vitals_history(patient_id: str, db: Session = Depends(get_db)):
    patient = svc.get_workflow_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")
    vitals = svc.get_patient_vitals(db, patient_id)
    return {
        "patient_id":   patient_id,
        "patient_name": patient.get("name"),
        "vitals":       vitals,
        "count":        len(vitals),
        "latest":       vitals[0] if vitals else None,
        "timestamp":    datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────────────────────
# 4. Doctor Diagnoses  —  POST /api/workflow/diagnose/{patient_id}
# ─────────────────────────────────────────────────────────────

@router.post("/diagnose/{patient_id}")
def diagnose_patient(patient_id: str, body: DiagnoseRequest, db: Session = Depends(get_db)):
    result = svc.diagnose_patient(db, patient_id, body.dict())
    if result is None:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")
    return result


# ─────────────────────────────────────────────────────────────
# 5. Pharmacy Queue  —  GET /api/workflow/pharmacy/queue
# ─────────────────────────────────────────────────────────────

@router.get("/pharmacy/queue")
def get_pharmacy_queue(status: Optional[str] = None, db: Session = Depends(get_db)):
    orders = svc.get_pharmacy_queue(db, status)
    return {
        "orders":          orders,
        "total":           len(orders),
        "pending_count":   sum(1 for o in orders if o["status"] == "pending"),
        "dispensed_count": sum(1 for o in orders if o["status"] == "dispensed"),
        "timestamp":       datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────────────────────
# 6. Dispense Medication  —  PATCH /api/workflow/pharmacy/{order_id}/dispense
# ─────────────────────────────────────────────────────────────

@router.patch("/pharmacy/{order_id}/dispense")
def dispense_medication(order_id: str, body: PharmacyDispenseRequest, db: Session = Depends(get_db)):
    result = svc.dispense_order(db, order_id, body.dispensed_by, body.notes)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ─────────────────────────────────────────────────────────────
# 7. Patient Full Summary  —  GET /api/workflow/patient/{patient_id}/summary
# ─────────────────────────────────────────────────────────────

@router.get("/patient/{patient_id}/summary")
def get_patient_workflow_summary(patient_id: str, db: Session = Depends(get_db)):
    summary = svc.get_unified_patient_summary(db, patient_id)
    if not summary:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")
    return summary


# ─────────────────────────────────────────────────────────────
# 8. Discharge Patient  —  POST /api/workflow/discharge/{patient_id}
# ─────────────────────────────────────────────────────────────

@router.post("/discharge/{patient_id}")
def discharge_patient(patient_id: str, body: DischargeRequest, db: Session = Depends(get_db)):
    result = svc.discharge_patient(db, patient_id, body.dict())
    if result is None:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")
    return result


# ─────────────────────────────────────────────────────────────
# 9. Billing Summary (Admin/CEO)  —  GET /api/workflow/billing/summary
# ─────────────────────────────────────────────────────────────

@router.get("/billing/summary")
def get_billing_summary(db: Session = Depends(get_db)):
    summary = svc.get_billing_summary(db)
    return {
        "workflow_billing": summary,
        "hospital_finance": summary.get("hospital_finance", {}),
        "pharmacy_orders":  summary.get("pharmacy_orders", {}),
        "timestamp":        datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────────────────────
# 10. Per-Patient Billing  —  GET /api/workflow/billing/patient/{patient_id}
# ─────────────────────────────────────────────────────────────

@router.get("/billing/patient/{patient_id}")
def get_patient_billing(patient_id: str, db: Session = Depends(get_db)):
    billing = svc.get_patient_billing(db, patient_id)
    if not billing.get("patient_name"):
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")
    return billing


# ─────────────────────────────────────────────────────────────
# 11. List All Workflow Patients  —  GET /api/workflow/patients
# ─────────────────────────────────────────────────────────────

@router.get("/patients")
def list_workflow_patients(status: Optional[str] = None, db: Session = Depends(get_db)):
    patients = svc.get_all_workflow_patients(db, status)
    return {
        "patients":  patients,
        "total":     len(patients),
        "admitted":  sum(1 for p in patients if p.get("status") == "admitted"),
        "discharged":sum(1 for p in patients if p.get("status") == "discharged"),
        "timestamp": datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────────────────────
# 12. Notifications  —  GET /api/workflow/notifications
# ─────────────────────────────────────────────────────────────

@router.get("/notifications")
def get_notifications(role: Optional[str] = None, unread_only: bool = False, db: Session = Depends(get_db)):
    notifs = svc.get_notifications(db, role, unread_only)
    return {
        "notifications": notifs,
        "total":         len(notifs),
        "unread":        sum(1 for n in notifs if not n["read"]),
        "timestamp":     datetime.now().isoformat(),
    }


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    svc.mark_notification_read(db, notification_id)
    return {"status": "read", "id": notification_id}


# ─────────────────────────────────────────────────────────────
# 13. Nurse List  —  GET /api/workflow/nurses
# ─────────────────────────────────────────────────────────────

@router.get("/nurses")
def get_nurses(db: Session = Depends(get_db)):
    nurses = svc.get_all_nurses(db)
    return {
        "nurses":    nurses,
        "total":     len(nurses),
        "on_duty":   sum(1 for n in nurses if n.get("on_duty")),
        "timestamp": datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────────────────────
# 14. Assign Nurse  —  POST /api/workflow/assign-nurse
# ─────────────────────────────────────────────────────────────

@router.post("/assign-nurse")
def assign_nurse(body: AssignNurseRequest, db: Session = Depends(get_db)):
    result = svc.assign_nurse(db, body.nurse_id, body.patient_id, body.assigned_by, body.notes)
    if result is None:
        raise HTTPException(status_code=404, detail="Nurse or patient not found")
    return result


# ─────────────────────────────────────────────────────────────
# 15. Nurse's Patients  —  GET /api/workflow/nurses/{nurse_id}/patients
# ─────────────────────────────────────────────────────────────

@router.get("/nurses/{nurse_id}/patients")
def get_nurse_patients(nurse_id: int, db: Session = Depends(get_db)):
    patients = svc.get_nurse_patients(db, nurse_id)
    return {
        "nurse_id":  nurse_id,
        "patients":  patients,
        "total":     len(patients),
        "timestamp": datetime.now().isoformat(),
    }
