# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# staff.py — Staff roster and duty endpoints
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter
from data.repository import (
    fetch_all_staff,
    fetch_staff_by_id,
    fetch_staff_by_department,
    fetch_staff_on_duty,
    fetch_doctors_on_duty,
    fetch_patients_by_doctor,
)
from datetime import datetime

router = APIRouter()


@router.get("/")
def get_all_staff():
    return {
        "staff"     : fetch_all_staff(),
        "count"     : len(fetch_all_staff()),
        "timestamp" : datetime.now().isoformat(),
    }


@router.get("/on-duty")
def get_staff_on_duty():
    on_duty = fetch_staff_on_duty()
    return {
        "staff"     : on_duty,
        "count"     : len(on_duty),
        "timestamp" : datetime.now().isoformat(),
    }


@router.get("/doctors-on-duty")
def get_doctors_on_duty():
    doctors = fetch_doctors_on_duty()
    return {
        "doctors"   : doctors,
        "count"     : len(doctors),
        "timestamp" : datetime.now().isoformat(),
    }


@router.get("/{staff_id}")
def get_staff_member(staff_id: str):
    member = fetch_staff_by_id(staff_id)
    if not member:
        return {"error": f"Staff '{staff_id}' not found"}
    return member


@router.get("/{staff_id}/patients")
def get_doctor_patients(staff_id: str):
    patients = fetch_patients_by_doctor(staff_id)
    return {
        "staff_id"  : staff_id,
        "patients"  : patients,
        "count"     : len(patients),
        "timestamp" : datetime.now().isoformat(),
    }


@router.get("/department/{department_id}")
def get_department_staff(department_id: str):
    staff = fetch_staff_by_department(department_id)
    return {
        "department_id" : department_id,
        "staff"         : staff,
        "count"         : len(staff),
        "timestamp"     : datetime.now().isoformat(),
    }