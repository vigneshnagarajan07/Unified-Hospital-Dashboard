# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# patients.py — Patient portal and record endpoints
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter
from data.repository import (
    fetch_all_patients,
    fetch_patient_by_id,
    fetch_patients_by_department,
)
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