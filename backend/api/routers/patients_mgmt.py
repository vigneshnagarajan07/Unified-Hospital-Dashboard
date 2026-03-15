# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# api/routers/patients_mgmt.py — Admin patient management CRUD
# UPDATED: Fully DB-backed via PatientMgmt + PatientVitals ORM
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import PatientMgmt, PatientVitals

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

def _patient_dict(p: PatientMgmt) -> dict:
    latest_vitals = p.vitals[-1] if p.vitals else None
    return {
        "id":               p.id,
        "name":             p.name,
        "age":              p.age,
        "gender":           p.gender,
        "department":       p.department,
        "assigned_doctor":  p.assigned_doctor,
        "diagnosis":        p.diagnosis,
        "contact":          p.contact,
        "admission_status": p.admission_status,
        "created_at":       p.created_at.isoformat() if p.created_at else None,
        "vitals": {
            "heart_rate":        latest_vitals.heart_rate        if latest_vitals else None,
            "blood_pressure":    latest_vitals.blood_pressure    if latest_vitals else None,
            "temperature":       latest_vitals.temperature       if latest_vitals else None,
            "oxygen_saturation": latest_vitals.oxygen_saturation if latest_vitals else None,
            "respiration_rate":  latest_vitals.respiration_rate  if latest_vitals else None,
            "notes":             latest_vitals.notes             if latest_vitals else None,
            "updated_at":        latest_vitals.updated_at.isoformat() if latest_vitals and latest_vitals.updated_at else None,
        } if latest_vitals else None,
    }


def _seed_initial_patients(db: Session):
    """Seed demo patients into DB if empty."""
    if db.query(PatientMgmt).count() > 0:
        return
    demo = [
        PatientMgmt(name="Senthil Kumar",   age=54, gender="Male",   department="Cardiology",       assigned_doctor="Dr. Ramesh Iyer",       diagnosis="Coronary Artery Disease",      contact="9876543210", admission_status="icu"),
        PatientMgmt(name="Meena Devi",      age=36, gender="Female", department="Obstetrics",       assigned_doctor="Dr. Meena Rajagopalan", diagnosis="Gestational Hypertension",     contact="9123456789", admission_status="admitted"),
        PatientMgmt(name="Arjun Sharma",    age=29, gender="Male",   department="Orthopedics",      assigned_doctor="Dr. Karthik Menon",     diagnosis="ACL Tear — Post-op",           contact="9000112233", admission_status="admitted"),
        PatientMgmt(name="Kavitha Rajan",   age=61, gender="Female", department="General Medicine", assigned_doctor="Dr. Priya Subramaniam", diagnosis="Type 2 Diabetes + Hypertension",contact="9111222333", admission_status="admitted"),
        PatientMgmt(name="Venkatesh Pillai",age=72, gender="Male",   department="Neurology",        assigned_doctor="Dr. Anitha Krishnan",   diagnosis="Ischemic Stroke",              contact="9444555666", admission_status="icu"),
        PatientMgmt(name="Priya Nair",      age=22, gender="Female", department="Emergency",        assigned_doctor="Dr. Vijay Nair",        diagnosis="Acute Appendicitis",           contact="9777888999", admission_status="admitted"),
    ]
    db.add_all(demo)
    db.flush()
    # Add vitals for first three patients
    vitals_data = [
        PatientVitals(patient_id=demo[0].id, heart_rate=92, blood_pressure="145/90", temperature=37.4, oxygen_saturation=94, respiration_rate=18, notes="Monitor SpO2 — pending echo"),
        PatientVitals(patient_id=demo[1].id, heart_rate=84, blood_pressure="138/88", temperature=37.1, oxygen_saturation=97, respiration_rate=16, notes="BP stable on medication"),
        PatientVitals(patient_id=demo[2].id, heart_rate=72, blood_pressure="118/76", temperature=36.9, oxygen_saturation=99, respiration_rate=14, notes="Post-op day 2 — mobilising"),
        PatientVitals(patient_id=demo[4].id, heart_rate=78, blood_pressure="130/82", temperature=37.2, oxygen_saturation=96, respiration_rate=17, notes="GCS 14/15 — improving"),
    ]
    db.add_all(vitals_data)
    db.commit()


# ── Routes ────────────────────────────────────────────────────

@router.get("/")
def list_patients(db: Session = Depends(get_db)):
    _seed_initial_patients(db)
    patients = db.query(PatientMgmt).order_by(PatientMgmt.created_at.desc()).all()
    return {"patients": [_patient_dict(p) for p in patients], "total": len(patients)}


@router.get("/{patient_id}")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    p = db.query(PatientMgmt).filter(PatientMgmt.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _patient_dict(p)


@router.post("/")
def create_patient(body: PatientCreate, db: Session = Depends(get_db)):
    p = PatientMgmt(**body.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"message": "Patient created", "patient": _patient_dict(p)}


@router.put("/{patient_id}")
def update_patient(patient_id: int, body: PatientUpdate, db: Session = Depends(get_db)):
    p = db.query(PatientMgmt).filter(PatientMgmt.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    for field, value in body.dict(exclude_none=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return {"message": "Patient updated", "patient": _patient_dict(p)}


@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    p = db.query(PatientMgmt).filter(PatientMgmt.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(p)
    db.commit()
    return {"message": "Patient deleted"}


@router.put("/vitals/update")
def update_vitals(body: VitalsUpdate, db: Session = Depends(get_db)):
    p = db.query(PatientMgmt).filter(PatientMgmt.id == body.patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Update existing vitals row or create new one
    vitals = db.query(PatientVitals).filter(PatientVitals.patient_id == body.patient_id).first()
    if vitals:
        for field, value in body.dict(exclude={"patient_id"}, exclude_none=True).items():
            setattr(vitals, field, value)
        vitals.updated_at = datetime.utcnow()
    else:
        data = body.dict(exclude={"patient_id"}, exclude_none=True)
        vitals = PatientVitals(patient_id=body.patient_id, **data)
        db.add(vitals)

    db.commit()
    db.refresh(vitals)
    return {
        "message": "Vitals updated",
        "vitals": {
            "heart_rate":        vitals.heart_rate,
            "blood_pressure":    vitals.blood_pressure,
            "temperature":       vitals.temperature,
            "oxygen_saturation": vitals.oxygen_saturation,
            "respiration_rate":  vitals.respiration_rate,
            "notes":             vitals.notes,
            "updated_at":        vitals.updated_at.isoformat() if vitals.updated_at else None,
        }
    }
