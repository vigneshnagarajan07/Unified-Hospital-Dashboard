# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# repository.py — Data access abstraction layer
# All modules query data through this layer only
# ─────────────────────────────────────────────────────────────

from data.hospital_data import (
    APOLLO_DEPARTMENTS,
    APOLLO_HOSPITAL_INFO,
    APOLLO_TREND_DATA,
    APOLLO_FINANCE,
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


# ── Patient queries ───────────────────────────────────────────

def fetch_all_patients():
    return APOLLO_PATIENTS


def fetch_patient_by_id(patient_id: str):
    return next(
        (p for p in APOLLO_PATIENTS if p["patient_id"] == patient_id),
        None
    )


def fetch_patients_by_department(department_id: str):
    return [
        p for p in APOLLO_PATIENTS
        if p["department_id"] == department_id
    ]


def fetch_patients_by_doctor(doctor_id: str):
    return [
        p for p in APOLLO_PATIENTS
        if p["assigned_doctor_id"] == doctor_id
    ]


def fetch_critical_patients():
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