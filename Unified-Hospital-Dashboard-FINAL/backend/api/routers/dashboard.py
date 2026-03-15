# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# api/routers/dashboard.py — Role-specific Dashboard API
# FIX: Added all missing imports that caused NameError on every route
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

# ── FIX: Import all helper functions that were being called but never imported ──
from services.hospital_agent import (
    get_admin_dashboard,
    get_department_dashboard,
    get_doctor_dashboard,
    get_patient_dashboard,
)
from data.repository import fetch_patient_by_id

router = APIRouter()


# ─────────────────────────────────────────────────────────────
# Admin / CEO Dashboard
# ─────────────────────────────────────────────────────────────

@router.get(
    "/admin",
    summary="Admin / CEO Dashboard",
    description=(
        "Returns full hospital intelligence: KPIs, anomaly alerts, "
        "predicted risks, ranked recommendations, and AI insights."
    ),
)
def admin_dashboard():
    try:
        data = get_admin_dashboard()
        return {
            **data,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard pipeline error: {str(e)}")


# ─────────────────────────────────────────────────────────────
# Department Head Dashboard
# ─────────────────────────────────────────────────────────────

@router.get(
    "/department/{department_id}",
    summary="Department Head Dashboard",
)
def department_dashboard(department_id: str):
    from data.repository import fetch_department_by_id
    dept = fetch_department_by_id(department_id)
    if not dept:
        raise HTTPException(
            status_code=404,
            detail=f"Department '{department_id}' not found. "
                   f"Valid IDs: cardiology, general_medicine, orthopedics, "
                   f"pediatrics, emergency, obstetrics"
        )

    try:
        data = get_department_dashboard(department_id)
        return {
            **data,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Department dashboard error: {str(e)}")


# ─────────────────────────────────────────────────────────────
# Doctor Dashboard
# ─────────────────────────────────────────────────────────────

@router.get(
    "/doctor/{doctor_id}",
    summary="Doctor Dashboard",
)
def doctor_dashboard(doctor_id: str):
    data = get_doctor_dashboard(doctor_id)

    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])

    return {
        **data,
        "timestamp": datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────────────────────
# Patient Dashboard
# ─────────────────────────────────────────────────────────────

@router.get(
    "/patient/{patient_id}",
    summary="Patient Dashboard",
)
def patient_dashboard(patient_id: str):
    data = get_patient_dashboard(patient_id)

    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])

    return {
        **data,
        "timestamp": datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────────────────────
# Patient Feedback Submission
# ─────────────────────────────────────────────────────────────

class FeedbackBody(BaseModel):
    rating : int    # 1-5
    comment: str = ""


@router.post(
    "/patient/{patient_id}/feedback",
    summary="Submit Patient Feedback",
)
def submit_feedback(patient_id: str, body: FeedbackBody):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5.")

    patient = fetch_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")

    db_patient_map = {
        "APL-2024-0847": "PAT001",
        "APL-2024-0901": "PAT002",
        "APL-2024-0923": "PAT003",
        "APL-2024-0931": "PAT004",
        "APL-2024-0945": "PAT005",
        "APL-2024-0958": "PAT006",
        "APL-2024-0972": "PAT007",
        "APL-2024-0983": "PAT008",
        "APL-2024-0994": "PAT009",
        "APL-2024-1005": "PAT010",
    }
    db_pid = db_patient_map.get(patient_id)

    if db_pid:
        try:
            from database.db import SessionLocal
            from models.models import PatientFeedback
            db = SessionLocal()
            fb = PatientFeedback(
                patient_id=db_pid,
                rating    =body.rating,
                comment   =body.comment,
            )
            db.add(fb)
            db.commit()
        except Exception as e:
            print(f"[Dashboard] Feedback persist error: {e}")
        finally:
            try:
                db.close()
            except Exception:
                pass

    return {
        "status"      : "success",
        "patient_id"  : patient_id,
        "patient_name": patient.get("name"),
        "rating"      : body.rating,
        "comment"     : body.comment,
        "message"     : "Thank you for your feedback!",
        "timestamp"   : datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────────────────────
# Full Agent Pipeline trigger
# ─────────────────────────────────────────────────────────────

@router.get(
    "/run-agent",
    summary="Trigger Full Intelligence Pipeline",
)
def run_full_agent():
    from services.hospital_agent import run_hospital_agent
    try:
        result = run_hospital_agent()
        return {
            **result,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent pipeline error: {str(e)}")
