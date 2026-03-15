# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# patients.py — Patient portal and record endpoints
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from data.repository import (
    fetch_all_patients,
    fetch_patient_by_id,
    fetch_patients_by_department,
)
from data.patient_data import APOLLO_PATIENTS
from services.ai_service import answer_patient_question
from datetime import datetime

router = APIRouter()


@router.get("/")
def get_all_patients():
    return {
        "patients"  : fetch_all_patients(),
        "count"     : len(fetch_all_patients()),
        "timestamp" : datetime.now().isoformat(),
    }


@router.get("/{patient_id}")
def get_patient(patient_id: str):
    patient = fetch_patient_by_id(patient_id)
    if not patient:
        return {"error": f"Patient '{patient_id}' not found"}
    return patient


@router.get("/{patient_id}/ai-report")
def get_patient_ai_report(patient_id: str):
    """
    Generate a comprehensive AI report for a patient.
    Includes vitals analysis, lab anomaly detection, risk scoring,
    outcome predictions, and an AI-generated clinical summary.
    """
    from services.ai_report_service import generate_patient_report

    patient = fetch_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")

    report = generate_patient_report(patient)
    return {
        "report": report,
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/{patient_id}/prescriptions")
def get_patient_prescriptions(patient_id: str):
    patient = fetch_patient_by_id(patient_id)
    if not patient:
        return {"error": "Patient not found"}
    return {
        "patient_id"    : patient_id,
        "patient_name"  : patient["name"],
        "prescriptions" : patient["prescriptions"],
    }


@router.get("/{patient_id}/lab-reports")
def get_patient_lab_reports(patient_id: str):
    patient = fetch_patient_by_id(patient_id)
    if not patient:
        return {"error": "Patient not found"}
    return {
        "patient_id"  : patient_id,
        "patient_name": patient["name"],
        "lab_reports" : patient["lab_reports"],
    }


@router.get("/{patient_id}/vitals")
def get_patient_vitals(patient_id: str):
    patient = fetch_patient_by_id(patient_id)
    if not patient:
        return {"error": "Patient not found"}
    return {
        "patient_id"  : patient_id,
        "patient_name": patient["name"],
        "vitals"      : patient["vitals"],
    }


@router.get("/{patient_id}/bill")
def get_patient_bill(patient_id: str):
    patient = fetch_patient_by_id(patient_id)
    if not patient:
        return {"error": "Patient not found"}
    return {
        "patient_id"   : patient_id,
        "patient_name" : patient["name"],
        "bill_estimate": patient["bill_estimate"],
    }


@router.get("/{patient_id}/discharge-checklist")
def get_discharge_checklist(patient_id: str):
    patient = fetch_patient_by_id(patient_id)
    if not patient:
        return {"error": "Patient not found"}
    checklist    = patient["discharge_checklist"]
    tasks_done   = sum(1 for t in checklist if t["completed"])
    total_tasks  = len(checklist)
    return {
        "patient_id"         : patient_id,
        "patient_name"       : patient["name"],
        "checklist"          : checklist,
        "tasks_completed"    : tasks_done,
        "tasks_total"        : total_tasks,
        "completion_percent" : round((tasks_done / total_tasks) * 100),
        "ready_for_discharge": tasks_done == total_tasks,
    }


class PatientQuestion(BaseModel):
    question: str


@router.post("/{patient_id}/ask")
def ask_patient_ai(patient_id: str, body: PatientQuestion):
    """
    Patient asks a health question — answered by Groq using their medical context.
    """
    patient = fetch_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")

    result = answer_patient_question(patient, body.question)

    return {
        "patient_id"  : patient_id,
        "patient_name": patient["name"],
        "question"    : body.question,
        "answer"      : result["answer"],
        "source"      : result["source"],
        "timestamp"   : datetime.now().isoformat(),
    }


@router.patch("/{patient_id}/discharge-checklist/{task_index}")
def toggle_discharge_task(patient_id: str, task_index: int):
    """
    Toggle the completed status of a discharge checklist item.
    Mutates in-memory APOLLO_PATIENTS list so it persists for the session.
    """
    # Find in APOLLO_PATIENTS for in-memory update
    patient_record = None
    for p in APOLLO_PATIENTS:
        if p["patient_id"] == patient_id:
            patient_record = p
            break

    if not patient_record:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")

    checklist = patient_record.get("discharge_checklist", [])
    if task_index < 0 or task_index >= len(checklist):
        raise HTTPException(
            status_code=400,
            detail=f"Task index {task_index} out of range (0-{len(checklist)-1})"
        )

    # Toggle the completed field
    checklist[task_index]["completed"] = not checklist[task_index]["completed"]

    tasks_done  = sum(1 for t in checklist if t["completed"])
    total_tasks = len(checklist)

    return {
        "patient_id"         : patient_id,
        "task_index"         : task_index,
        "task"               : checklist[task_index]["task"],
        "completed"          : checklist[task_index]["completed"],
        "tasks_completed"    : tasks_done,
        "tasks_total"        : total_tasks,
        "completion_percent" : round((tasks_done / total_tasks) * 100),
        "ready_for_discharge": tasks_done == total_tasks,
        "timestamp"          : datetime.now().isoformat(),
    }