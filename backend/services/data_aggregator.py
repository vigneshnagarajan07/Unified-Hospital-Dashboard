# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# services/data_aggregator.py — M1 Data Aggregation Service
# Collects, normalises and merges all hospital data streams
# ─────────────────────────────────────────────────────────────

from datetime import datetime, timedelta, date
from data.repository import (
    fetch_all_departments,
    fetch_all_patients,
    fetch_all_staff,
    fetch_finance_data,
    fetch_trend_data,
)


# ────────────────────────────────────────────────────────────
# 1. Simulated sub-system data collectors
#    These mimic real external system calls (HIS / LIMS / RCM)
# ────────────────────────────────────────────────────────────

def get_bed_occupancy_data(query_date: date | None = None) -> dict:
    """
    Bed occupancy data blending hardcoded totals with REAL DB admission counts.
    Falls back to static data if DB is unavailable.
    """
    departments = fetch_all_departments()
    query_date  = query_date or date.today()

    # Try to get real occupied-bed counts from DB
    db_counts = {}
    try:
        from database.db import SessionLocal
        from models.workflow_models import WorkflowPatient
        from sqlalchemy import func
        db = SessionLocal()
        try:
            rows = (
                db.query(WorkflowPatient.department_id, func.count(WorkflowPatient.id))
                .filter(WorkflowPatient.status == "admitted")
                .group_by(WorkflowPatient.department_id)
                .all()
            )
            db_counts = {dept_id: cnt for dept_id, cnt in rows}
        finally:
            db.close()
    except Exception:
        pass  # Fallback to static data

    dept_beds = []
    for dept in departments:
        total    = dept["total_beds"]
        # Prefer DB count; fall back to static occupied_beds
        occupied = db_counts.get(dept["id"], dept["occupied_beds"])
        occupied = min(occupied, total)  # Safety: can't exceed total
        icu_total = dept.get("icu_beds_total", 0)
        icu_occ   = dept.get("icu_beds_occupied", 0)
        dept_beds.append({
            "department_id"    : dept["id"],
            "department_name"  : dept["name"],
            "total_beds"       : total,
            "occupied_beds"    : occupied,
            "icu_beds_total"   : icu_total,
            "icu_beds_occupied": icu_occ,
            "bed_occupancy_pct": round((occupied / total) * 100, 1) if total > 0 else 0.0,
        })

    total_beds     = sum(d["total_beds"] for d in dept_beds)
    total_occupied = sum(d["occupied_beds"] for d in dept_beds)

    return {
        "query_date"            : str(query_date),
        "hospital_occupancy_pct": round((total_occupied / total_beds) * 100, 1) if total_beds > 0 else 0.0,
        "total_beds"            : total_beds,
        "occupied_beds"         : total_occupied,
        "available_beds"        : total_beds - total_occupied,
        "by_department"         : dept_beds,
    }


def get_opd_wait_times(query_date: date | None = None, department: str | None = None) -> dict:
    """
    Simulates a call to the OPD Queue Management System.
    Returns wait times per department, or for a specific department.
    """
    departments = fetch_all_departments()
    query_date  = query_date or date.today()

    opd_data = []
    for dept in departments:
        if department and dept["id"] != department:
            continue
        wait     = dept["opd_wait_time_min"]
        baseline = dept["opd_baseline_wait_min"]
        delta    = round(((wait - baseline) / baseline) * 100, 1) if baseline > 0 else 0.0
        opd_data.append({
            "department_id"   : dept["id"],
            "department_name" : dept["name"],
            "wait_time_min"   : wait,
            "baseline_min"    : baseline,
            "delta_pct"       : delta,
            "opd_patients"    : dept["opd_patients_today"],
            "status"          : "critical" if delta >= 30 else "warning" if delta >= 15 else "normal",
        })

    avg_wait = round(sum(d["wait_time_min"] for d in opd_data) / len(opd_data), 1) if opd_data else 0.0

    return {
        "query_date"      : str(query_date),
        "avg_wait_min"    : avg_wait,
        "by_department"   : opd_data,
    }


def get_billing_collection_report(date_range: int = 7) -> dict:
    """
    Revenue report blending static trends with REAL billing data from DB.
    """
    finance = fetch_finance_data()
    trend   = fetch_trend_data()

    # Simulate daily billing deltas from trend
    revenue_trend = trend.get("revenue_lakh", [15.0] * date_range)
    total_billed    = sum(revenue_trend[-date_range:]) * 100000     # convert lakh → INR
    collection_rate = finance.get("insurance_claims_pct", 80.0)
    total_collected = round(total_billed * collection_rate / 100, 2)
    pending         = finance.get("pending_bills_lakh", 0) * 100000

    # Overlay real DB billing totals if available
    db_revenue = 0.0
    try:
        from database.db import SessionLocal
        from models.workflow_models import BillingTransaction
        from sqlalchemy import func
        db = SessionLocal()
        try:
            result = db.query(func.coalesce(func.sum(BillingTransaction.amount), 0)).scalar()
            db_revenue = float(result or 0)
        finally:
            db.close()
    except Exception:
        pass

    # Blend: use whichever is larger (static sim or real DB)
    effective_billed = max(total_billed, db_revenue)

    return {
        "date_range_days"       : date_range,
        "total_billed_inr"      : effective_billed,
        "total_collected_inr"   : round(effective_billed * collection_rate / 100, 2),
        "collection_rate_pct"   : collection_rate,
        "pending_bills_inr"     : pending,
        "avg_bill_inpatient"    : finance.get("avg_bill_inpatient", 0),
        "avg_bill_outpatient"   : finance.get("avg_bill_outpatient", 0),
        "revenue_today_lakh"    : finance.get("revenue_today_lakh", 0),
        "revenue_mtd_lakh"      : finance.get("revenue_mtd_lakh", 0),
        "revenue_target_lakh"   : finance.get("revenue_target_lakh", 0),
        "db_revenue_inr"        : db_revenue,  # Real DB total for CEO view
    }


def get_lab_tat_data(query_date: date | None = None) -> dict:
    """
    Simulates a call to the Laboratory Information System (LIS).
    Returns average turnaround time per department.
    """
    query_date = query_date or date.today()
    # Simulated lab TAT data aligned with existing dept structure
    lab_tat_by_dept = {
        "cardiology":       {"avg_tat_hours": 4.2, "tests_run": 38, "pending": 4},
        "general_medicine": {"avg_tat_hours": 3.8, "tests_run": 72, "pending": 6},
        "orthopedics":      {"avg_tat_hours": 5.1, "tests_run": 15, "pending": 2},
        "pediatrics":       {"avg_tat_hours": 3.5, "tests_run": 24, "pending": 1},
        "emergency":        {"avg_tat_hours": 1.8, "tests_run": 55, "pending": 8},
        "obstetrics":       {"avg_tat_hours": 4.0, "tests_run": 18, "pending": 3},
    }

    all_tats = [v["avg_tat_hours"] for v in lab_tat_by_dept.values()]
    avg_tat  = round(sum(all_tats) / len(all_tats), 2) if all_tats else 0.0

    return {
        "query_date"   : str(query_date),
        "avg_tat_hours": avg_tat,
        "by_department": lab_tat_by_dept,
        "total_tests"  : sum(v["tests_run"] for v in lab_tat_by_dept.values()),
        "total_pending": sum(v["pending"]   for v in lab_tat_by_dept.values()),
    }


def get_patient_satisfaction_scores(date_range: int = 7) -> dict:
    """
    Simulates a call to the Patient Experience platform.
    Returns NPS and satisfaction ratings.
    """
    departments = fetch_all_departments()
    scores = []
    for dept in departments:
        sat = dept.get("patient_satisfaction", 4.0)
        nps = round((sat - 1) / 4 * 100, 1)   # convert 1-5 scale → 0-100 NPS proxy
        scores.append({
            "department_id"  : dept["id"],
            "department_name": dept["name"],
            "satisfaction_score": sat,
            "nps"            : nps,
            "responses"      : dept.get("opd_patients_today", 0) // 5,  # assume ~20% response rate
        })

    avg_sat = round(sum(s["satisfaction_score"] for s in scores) / len(scores), 2) if scores else 0.0
    avg_nps = round(sum(s["nps"] for s in scores) / len(scores), 1) if scores else 0.0

    return {
        "date_range_days"   : date_range,
        "avg_satisfaction"  : avg_sat,
        "avg_nps"           : avg_nps,
        "by_department"     : scores,
    }


# ────────────────────────────────────────────────────────────
# 2. Master collector — called by hospital_agent.py
# ────────────────────────────────────────────────────────────

def collect_hospital_data(query_date: date | None = None) -> dict:
    """
    Orchestrates all sub-system data collectors and merges
    them into a single normalised dictionary consumed by the
    KPI engine, anomaly detector and prediction engine.

    Returns
    -------
    {
        "beds":         { ... },
        "opd":          { ... },
        "billing":      { ... },
        "lab":          { ... },
        "satisfaction": { ... },
        "departments":  [ ... ],   # raw department list
        "staff":        [ ... ],   # raw staff list
        "collected_at": ISO-string
    }
    """
    query_date = query_date or date.today()

    beds         = get_bed_occupancy_data(query_date)
    opd          = get_opd_wait_times(query_date)
    billing      = get_billing_collection_report(date_range=7)
    lab          = get_lab_tat_data(query_date)
    satisfaction = get_patient_satisfaction_scores(date_range=7)
    departments  = fetch_all_departments()
    staff        = fetch_all_staff()

    return {
        "beds"         : beds,
        "opd"          : opd,
        "billing"      : billing,
        "lab"          : lab,
        "satisfaction" : satisfaction,
        "departments"  : departments,
        "staff"        : staff,
        "collected_at" : datetime.now().isoformat(),
    }
