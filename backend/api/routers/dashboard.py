# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# api/routers/dashboard.py — Role-specific Dashboard API
# Delegates to hospital_agent.py for all intelligence data
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()



# ─────────────────────────────────────────────────────────────
# Admin / CEO Dashboard
# Role: admin (same role for both Admin and CEO per system design)
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
    """
    GET /api/dashboard/admin

    Payload includes:
    - Hospital KPIs (bed occupancy, OPD wait, surgery rate, satisfaction)
    - Health score (0-100 with grade)
    - Anomaly alerts (critical + warning)
    - Predicted KPI breaches (48-hr window)
    - Ranked recommended actions
    - Natural language insights
    """
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
    description=(
        "Returns department-scoped KPIs, operational alerts, "
        "root cause analysis, and recommendations."
    ),
)
def department_dashboard(department_id: str):
    """
    GET /api/dashboard/department/{department_id}

    department_id examples: cardiology, general_medicine, orthopedics,
                             pediatrics, emergency, obstetrics

    Payload includes:
    - Department enriched KPI snapshot
    - Department anomaly alerts
    - Root cause explanations scoped to this department
    - Recommendations scoped to this department
    - Department insights
    - Department predictions (48-hr)
    """
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
    description=(
        "Returns doctor-specific schedule, patient queue, "
        "and department-level alerts."
    ),
)
def doctor_dashboard(doctor_id: str):
    """
    GET /api/dashboard/doctor/{doctor_id}

    doctor_id examples: DOC001, DOC002, DOC003, DOC004, DOC005, DOC006

    Payload includes:
    - Doctor profile + shift details
    - Patient queue (admitted patients under this doctor)
    - Department anomaly alerts
    - Timestamp
    """
    data = get_doctor_dashboard(doctor_id)

    if "error" in data:
        raise HTTPException(
            status_code=404,
            detail=data["error"]
        )

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
    description=(
        "Returns patient-specific appointments, lab results, "
        "billing summary, and allows feedback submission."
    ),
)
def patient_dashboard(patient_id: str):
    """
    GET /api/dashboard/patient/{patient_id}

    patient_id examples: APL-2024-0847, APL-2024-0901, APL-2024-0923

    Payload includes:
    - Patient admission details
    - Appointments list
    - Lab reports
    - Billing summary (estimate)
    - Vitals history
    - Prescription list
    - Discharge checklist
    """
    data = get_patient_dashboard(patient_id)

    if "error" in data:
        raise HTTPException(
            status_code=404,
            detail=data["error"]
        )

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
    """
    POST /api/dashboard/patient/{patient_id}/feedback

    Persists rating (1-5) and optional comment to PatientFeedback table.
    """
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5.")

    patient = fetch_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")

    # Map mock patient_id to DB patient_id
    db_patient_map = {
        "APL-2024-0847": "PAT001",
        "APL-2024-0901": "PAT002",
        "APL-2024-0923": "PAT003",
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
# Full Agent Pipeline (for testing / admin triggers)
# ─────────────────────────────────────────────────────────────

@router.get(
    "/run-agent",
    summary="Trigger Full Intelligence Pipeline",
    description="Manually trigger the hospital agent and return the complete pipeline result.",
)
def run_full_agent():
    """
    GET /api/dashboard/run-agent

    Executes the entire 7-step intelligence pipeline:
    collect → KPI → anomaly → root_cause → insight → recommendation → prediction
    """
    from services.hospital_agent import run_hospital_agent
    try:
        result = run_hospital_agent()
        return {
            **result,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent pipeline error: {str(e)}")
