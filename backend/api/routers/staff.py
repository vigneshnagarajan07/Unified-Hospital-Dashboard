# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# staff.py — Staff roster and bed availability endpoints
# FIX: Added bed layout GET and bed status PATCH endpoints
#      for the Floor Supervisor bed editing UI
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
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

# In-memory bed status override store (simulates DB writes)
# Key: "department_id:bed_id"  Value: "available" | "occupied" | "maintenance"
_BED_STATUS_OVERRIDES: dict[str, str] = {}


# ── Staff endpoints ───────────────────────────────────────────

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
    # Prevent "beds" from matching this route if placed after /beds
    if staff_id in ("beds",):
        raise HTTPException(status_code=404, detail="Not found")
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


# ── Bed Management endpoints (NEW) ───────────────────────────

@router.get("/beds/all")
def get_all_bed_layouts():
    """
    GET /api/staff/beds/all
    Returns full bed layout across all departments.
    Applies any in-memory status overrides from PATCH calls.
    """
    from data.hospital_data import APOLLO_BED_LAYOUT, APOLLO_DEPARTMENTS
    result = []
    for dept in APOLLO_DEPARTMENTS:
        dept_id   = dept["id"]
        layout    = APOLLO_BED_LAYOUT.get(dept_id, {})
        total     = dept["total_beds"]
        occupied  = dept["occupied_beds"]
        wards_out = []
        for ward_key, ward_data in layout.items():
            beds_out = []
            for bed in ward_data["beds"]:
                override_key = f"{dept_id}:{bed['bed_id']}"
                status = _BED_STATUS_OVERRIDES.get(override_key, bed["status"])
                beds_out.append({**bed, "status": status})
            wards_out.append({
                "ward_id"   : ward_key,
                "ward_label": ward_data["ward_label"],
                "beds"      : beds_out,
                "total_beds": len(beds_out),
                "occupied"  : sum(1 for b in beds_out if b["status"] == "occupied"),
                "available" : sum(1 for b in beds_out if b["status"] == "available"),
                "maintenance": sum(1 for b in beds_out if b["status"] == "maintenance"),
            })
        result.append({
            "department_id"  : dept_id,
            "department_name": dept["name"],
            "floor"          : dept["floor"],
            "total_beds"     : total,
            "occupied_beds"  : occupied,
            "wards"          : wards_out,
        })
    return {
        "departments" : result,
        "timestamp"   : datetime.now().isoformat(),
    }


@router.get("/beds/{department_id}")
def get_department_bed_layout(department_id: str):
    """
    GET /api/staff/beds/{department_id}
    Returns bed layout for a single department with current statuses.
    """
    from data.hospital_data import APOLLO_BED_LAYOUT, APOLLO_DEPARTMENTS
    dept_info = next((d for d in APOLLO_DEPARTMENTS if d["id"] == department_id), None)
    if not dept_info:
        raise HTTPException(status_code=404, detail=f"Department '{department_id}' not found")

    layout = APOLLO_BED_LAYOUT.get(department_id, {})
    wards_out = []
    for ward_key, ward_data in layout.items():
        beds_out = []
        for bed in ward_data["beds"]:
            override_key = f"{department_id}:{bed['bed_id']}"
            status = _BED_STATUS_OVERRIDES.get(override_key, bed["status"])
            beds_out.append({**bed, "status": status})
        wards_out.append({
            "ward_id"    : ward_key,
            "ward_label" : ward_data["ward_label"],
            "beds"       : beds_out,
            "total_beds" : len(beds_out),
            "occupied"   : sum(1 for b in beds_out if b["status"] == "occupied"),
            "available"  : sum(1 for b in beds_out if b["status"] == "available"),
            "maintenance": sum(1 for b in beds_out if b["status"] == "maintenance"),
        })

    return {
        "department_id"  : department_id,
        "department_name": dept_info["name"],
        "floor"          : dept_info["floor"],
        "total_beds"     : dept_info["total_beds"],
        "occupied_beds"  : dept_info["occupied_beds"],
        "wards"          : wards_out,
        "timestamp"      : datetime.now().isoformat(),
    }


class BedStatusUpdate(BaseModel):
    bed_id    : str
    new_status: str             # "available" | "occupied" | "maintenance"
    patient_id  : Optional[str] = None
    patient_name: Optional[str] = None
    reason      : Optional[str] = None   # e.g. "Cleaning", "Equipment repair"


@router.patch("/beds/{department_id}")
def update_bed_status(department_id: str, body: BedStatusUpdate):
    """
    PATCH /api/staff/beds/{department_id}
    Update a single bed's status (available / occupied / maintenance).
    Persists in-memory for the session.

    Body:
        bed_id     : "3A-12"
        new_status : "available" | "occupied" | "maintenance"
        patient_id : optional — set when marking occupied
        patient_name: optional
        reason     : optional note
    """
    VALID_STATUSES = {"available", "occupied", "maintenance"}
    if body.new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status '{body.new_status}'. Must be one of: {VALID_STATUSES}"
        )

    from data.hospital_data import APOLLO_BED_LAYOUT, APOLLO_DEPARTMENTS
    dept_info = next((d for d in APOLLO_DEPARTMENTS if d["id"] == department_id), None)
    if not dept_info:
        raise HTTPException(status_code=404, detail=f"Department '{department_id}' not found")

    # Validate bed_id exists in layout
    layout   = APOLLO_BED_LAYOUT.get(department_id, {})
    all_beds = [b for ward in layout.values() for b in ward["beds"]]
    bed      = next((b for b in all_beds if b["bed_id"] == body.bed_id), None)
    if not bed:
        raise HTTPException(
            status_code=404,
            detail=f"Bed '{body.bed_id}' not found in department '{department_id}'"
        )

    override_key = f"{department_id}:{body.bed_id}"
    old_status   = _BED_STATUS_OVERRIDES.get(override_key, bed["status"])
    _BED_STATUS_OVERRIDES[override_key] = body.new_status

    # Optional: persist to DB
    try:
        from database.db import SessionLocal
        db = SessionLocal()
        # Could write to a BedStatus table if it exists
        db.close()
    except Exception:
        pass

    return {
        "status"         : "updated",
        "department_id"  : department_id,
        "bed_id"         : body.bed_id,
        "old_status"     : old_status,
        "new_status"     : body.new_status,
        "patient_id"     : body.patient_id,
        "patient_name"   : body.patient_name,
        "reason"         : body.reason,
        "updated_by"     : "floor_supervisor",
        "updated_at"     : datetime.now().isoformat(),
    }


@router.post("/beds/{department_id}/bulk-update")
def bulk_update_beds(department_id: str, updates: list[BedStatusUpdate]):
    """
    POST /api/staff/beds/{department_id}/bulk-update
    Update multiple bed statuses at once.
    """
    results = []
    for update in updates:
        try:
            result = update_bed_status(department_id, update)
            results.append(result)
        except HTTPException as e:
            results.append({"bed_id": update.bed_id, "error": e.detail})
    return {
        "updated"   : len([r for r in results if "error" not in r]),
        "failed"    : len([r for r in results if "error" in r]),
        "results"   : results,
        "timestamp" : datetime.now().isoformat(),
    }
