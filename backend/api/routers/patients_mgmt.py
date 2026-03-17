# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# api/routers/patients_mgmt.py — Admin patient management CRUD
# UPDATED: Uses WorkflowPatient (unified ORM) instead of PatientMgmt
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from database.db import get_db
from models.workflow_models import WorkflowPatient, VitalsLog

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────

class PatientCreate(BaseModel):
    name:             str
    age:              Optional[int]   = None
    gender:           Optional[str]   = None
    department:       Optional[str]   = None
    assigned_doctor:  Optional[str]   = None
    diagnosis:        Optional[str]   = None
    contact:          Optional[str]   = None
    admission_status: Optional[str]   = "admitted"


class PatientUpdate(BaseModel):
    name:             Optional[str]   = None
    age:              Optional[int]   = None
    gender:           Optional[str]   = None
    department:       Optional[str]   = None
    assigned_doctor:  Optional[str]   = None
    diagnosis:        Optional[str]   = None
    contact:          Optional[str]   = None
    admission_status: Optional[str]   = None


class VitalsUpdate(BaseModel):
    patient_id:        int
    heart_rate:        Optional[int]   = None
    blood_pressure:    Optional[str]   = None
    temperature:       Optional[float] = None
    oxygen_saturation: Optional[int]   = None
    respiration_rate:  Optional[int]   = None
    notes:             Optional[str]   = None


# ── Serializers ───────────────────────────────────────────────

def _patient_dict(p: WorkflowPatient) -> dict:
    """Serialize a WorkflowPatient to the dict shape the frontend expects."""
    latest_vitals = p.vitals[-1] if p.vitals else None
    return {
        "id":               p.id,
        "patient_id":       p.patient_id,
        "name":             p.name,
        "age":              p.age,
        "gender":           p.gender,
        "department":       p.department_name,
        "department_id":    p.department_id,
        "assigned_doctor":  p.assigned_doctor,
        "diagnosis":        p.diagnosis,
        "contact":          p.phone,
        "admission_status": p.status,
        "ward":             p.ward,
        "is_critical":      p.is_critical,
        "admission_date":   p.admission_date,
        "expected_discharge": p.expected_discharge,
        "created_at":       p.created_at.isoformat() if p.created_at else None,
        "vitals": {
            "heart_rate":        latest_vitals.pulse_bpm         if latest_vitals else None,
            "blood_pressure":    latest_vitals.blood_pressure    if latest_vitals else None,
            "temperature":       latest_vitals.temperature_f     if latest_vitals else None,
            "oxygen_saturation": latest_vitals.spo2_pct          if latest_vitals else None,
            "respiration_rate":  latest_vitals.respiration_rate   if latest_vitals else None,
            "notes":             latest_vitals.notes              if latest_vitals else None,
            "updated_at":        latest_vitals.recorded_at.isoformat() if latest_vitals and latest_vitals.recorded_at else None,
        } if latest_vitals else None,
    }


# ── Department ID mapping ────────────────────────────────────

_DEPT_MAP = {
    "Cardiology":               "cardiology",
    "General Medicine":         "general_medicine",
    "Orthopedics":              "orthopedics",
    "Pediatrics":               "pediatrics",
    "Emergency":                "emergency",
    "Obstetrics & Gynaecology": "obstetrics",
    "Obstetrics":               "obstetrics",
    "Neurology":                "neurology",
}


# ── Routes ────────────────────────────────────────────────────

@router.get("/")
def list_patients(db: Session = Depends(get_db)):
    patients = db.query(WorkflowPatient).order_by(WorkflowPatient.created_at.desc()).all()
    return {"patients": [_patient_dict(p) for p in patients], "total": len(patients)}


@router.get("/{patient_id}")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    p = db.query(WorkflowPatient).filter(WorkflowPatient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _patient_dict(p)


@router.post("/")
def create_patient(body: PatientCreate, db: Session = Depends(get_db)):
    import uuid
    dept_id = _DEPT_MAP.get(body.department or "", body.department or "")
    p = WorkflowPatient(
        patient_id         = f"APL-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}",
        name               = body.name,
        age                = body.age,
        gender             = body.gender,
        department_id      = dept_id,
        department_name    = body.department,
        assigned_doctor    = body.assigned_doctor,
        diagnosis          = body.diagnosis,
        phone              = body.contact,
        status             = body.admission_status or "admitted",
        admission_date     = datetime.now().strftime("%Y-%m-%d"),
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"message": "Patient created", "patient": _patient_dict(p)}


@router.put("/{patient_id}")
def update_patient(patient_id: int, body: PatientUpdate, db: Session = Depends(get_db)):
    p = db.query(WorkflowPatient).filter(WorkflowPatient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    field_map = {
        "name":             "name",
        "age":              "age",
        "gender":           "gender",
        "department":       "department_name",
        "assigned_doctor":  "assigned_doctor",
        "diagnosis":        "diagnosis",
        "contact":          "phone",
        "admission_status": "status",
    }
    for pydantic_field, value in body.dict(exclude_none=True).items():
        orm_field = field_map.get(pydantic_field, pydantic_field)
        setattr(p, orm_field, value)
        if pydantic_field == "department":
            p.department_id = _DEPT_MAP.get(value, value)

    db.commit()
    db.refresh(p)
    return {"message": "Patient updated", "patient": _patient_dict(p)}


@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    p = db.query(WorkflowPatient).filter(WorkflowPatient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(p)
    db.commit()
    return {"message": "Patient deleted"}


@router.put("/vitals/update")
def update_vitals(body: VitalsUpdate, db: Session = Depends(get_db)):
    p = db.query(WorkflowPatient).filter(WorkflowPatient.id == body.patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Add a new vitals log entry (append model, not update-in-place)
    vitals = VitalsLog(
        patient_id       = p.patient_id,
        blood_pressure   = body.blood_pressure,
        pulse_bpm        = body.heart_rate,
        temperature_f    = body.temperature,
        spo2_pct         = body.oxygen_saturation,
        respiration_rate  = body.respiration_rate,
        notes            = body.notes,
        recorded_by      = "Admin",
    )
    db.add(vitals)
    db.commit()
    db.refresh(vitals)

    return {
        "message": "Vitals updated",
        "vitals": {
            "heart_rate":        vitals.pulse_bpm,
            "blood_pressure":    vitals.blood_pressure,
            "temperature":       vitals.temperature_f,
            "oxygen_saturation": vitals.spo2_pct,
            "respiration_rate":  vitals.respiration_rate,
            "notes":             vitals.notes,
            "updated_at":        vitals.recorded_at.isoformat() if vitals.recorded_at else None,
        }
    }
