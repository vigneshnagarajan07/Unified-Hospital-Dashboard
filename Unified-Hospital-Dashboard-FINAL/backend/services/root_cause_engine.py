# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# services/root_cause_engine.py — Rule-Based Root Cause Analysis
# Correlates multiple KPI signals to explain WHY anomalies occur
# ─────────────────────────────────────────────────────────────

from datetime import datetime


# ── Rule definitions ──────────────────────────────────────────
# Each rule is: (condition_fn, root_cause, explanation_template, severity)

def _analyze_department(dept: dict, anomalies: list[dict]) -> list[dict]:
    """
    Run all root cause rules against a single department and its anomalies.

    Returns a list of root cause objects.
    """
    dept_id   = dept["id"]
    dept_name = dept["name"]
    results   = []

    # Pre-compute department-level indicators
    dept_anomaly_types = {
        a["kpi_name"] for a in anomalies
        if a.get("department_id") == dept_id
    }

    bed_pct      = round((dept["occupied_beds"] / dept["total_beds"]) * 100, 1)
    wait_min     = dept["opd_wait_time_min"]
    wait_baseline= dept["opd_baseline_wait_min"]
    wait_up      = wait_min > wait_baseline * 1.15
    doctors      = dept.get("staff_doctors", 0)
    nurses       = dept.get("staff_nurses", 0)
    critical_pts = dept.get("critical_patients", 0)
    opd_patients = dept.get("opd_patients_today", 0)
    surgeries_done     = dept.get("surgeries_completed", 0)
    surgeries_scheduled= dept.get("surgeries_scheduled", 0)

    # ── Rule 1: Doctor shortage driving OPD wait spike ────────
    if wait_up and doctors < 5:
        results.append({
            "rule_id"       : "RC001",
            "department_id" : dept_id,
            "department_name": dept_name,
            "root_cause"    : "Doctor Shortage",
            "explanation"   : (
                f"{dept_name} OPD wait time has risen to {wait_min} min "
                f"({round((wait_min-wait_baseline)/wait_baseline*100)}% above baseline). "
                f"Only {doctors} doctor(s) are active — insufficient for current OPD load of {opd_patients} patients."
            ),
            "contributing_factors": ["Low doctor count", "High OPD load", "Wait time spike"],
            "severity"      : "critical",
            "detected_at"   : datetime.now().isoformat(),
        })

    # ── Rule 2: Lab overload (high patient volume + high TAT) ─
    if "lab_tat" in dept_anomaly_types and opd_patients > 100:
        results.append({
            "rule_id"       : "RC002",
            "department_id" : dept_id,
            "department_name": dept_name,
            "root_cause"    : "Lab Overload",
            "explanation"   : (
                f"{dept_name} has {opd_patients} OPD patients today. "
                f"The high test volume is exceeding lab processing capacity, "
                f"causing turnaround time to spike beyond the 4-hour baseline."
            ),
            "contributing_factors": ["High test volume", "Insufficient lab capacity", "Increased OPD load"],
            "severity"      : "warning",
            "detected_at"   : datetime.now().isoformat(),
        })

    # ── Rule 3: Bed capacity shortage ─────────────────────────
    if bed_pct >= 90:
        results.append({
            "rule_id"       : "RC003",
            "department_id" : dept_id,
            "department_name": dept_name,
            "root_cause"    : "Bed Capacity Shortage",
            "explanation"   : (
                f"{dept_name} is at {bed_pct}% bed occupancy "
                f"({dept['occupied_beds']}/{dept['total_beds']} beds occupied). "
                f"With {critical_pts} critical patients, admission pressure is extremely high."
            ),
            "contributing_factors": ["High occupancy", "Slow discharge rate", "Critical patient load"],
            "severity"      : "critical",
            "detected_at"   : datetime.now().isoformat(),
        })
    elif bed_pct >= 80:
        results.append({
            "rule_id"       : "RC003W",
            "department_id" : dept_id,
            "department_name": dept_name,
            "root_cause"    : "Bed Capacity Pressure",
            "explanation"   : (
                f"{dept_name} has {bed_pct}% bed occupancy. "
                f"Proactive discharge planning needed to prevent critical overflow."
            ),
            "contributing_factors": ["High occupancy approaching critical threshold"],
            "severity"      : "warning",
            "detected_at"   : datetime.now().isoformat(),
        })

    # ── Rule 4: ICU capacity exhausted ────────────────────────
    icu_total = dept.get("icu_beds_total", 0)
    icu_occ   = dept.get("icu_beds_occupied", 0)
    if icu_total > 0 and icu_occ >= icu_total:
        results.append({
            "rule_id"       : "RC004",
            "department_id" : dept_id,
            "department_name": dept_name,
            "root_cause"    : "ICU Capacity Exhausted",
            "explanation"   : (
                f"{dept_name} ICU has all {icu_total} beds occupied. "
                f"No buffer exists for incoming critical patients. "
                f"Cross-department ICU sharing or step-downs are required immediately."
            ),
            "contributing_factors": ["Full ICU", "No overflow buffer", "High critical patient count"],
            "severity"      : "critical",
            "detected_at"   : datetime.now().isoformat(),
        })

    # ── Rule 5: Surgical backlog ───────────────────────────────
    if surgeries_scheduled > 0 and surgeries_done < surgeries_scheduled:
        pending = surgeries_scheduled - surgeries_done
        rate    = round(surgeries_done / surgeries_scheduled * 100, 1)
        if rate < 80:
            results.append({
                "rule_id"       : "RC005",
                "department_id" : dept_id,
                "department_name": dept_name,
                "root_cause"    : "Surgical Backlog",
                "explanation"   : (
                    f"{dept_name} has completed only {surgeries_done}/{surgeries_scheduled} "
                    f"scheduled surgeries ({rate}%). {pending} case(s) remain pending — "
                    f"likely due to OT time constraints or staffing."
                ),
                "contributing_factors": ["Incomplete surgeries", "OT pressure", "Staff availability"],
                "severity"      : "warning",
                "detected_at"   : datetime.now().isoformat(),
            })

    # ── Rule 6: Nurse-to-patient ratio too low ─────────────────
    nurse_ratio = nurses / max(dept["occupied_beds"], 1)
    if nurse_ratio < 0.15 and dept["occupied_beds"] > 10:
        results.append({
            "rule_id"       : "RC006",
            "department_id" : dept_id,
            "department_name": dept_name,
            "root_cause"    : "Insufficient Nurse Coverage",
            "explanation"   : (
                f"{dept_name} has {nurses} nurse(s) for {dept['occupied_beds']} occupied beds "
                f"(ratio: {nurse_ratio:.2f}). Recommended minimum is 0.20. "
                f"Patient safety and satisfaction may be affected."
            ),
            "contributing_factors": ["Low nurse-to-bed ratio", "High ward occupancy"],
            "severity"      : "warning",
            "detected_at"   : datetime.now().isoformat(),
        })

    return results


def analyze_root_causes(hospital_data: dict, anomalies: list[dict]) -> list[dict]:
    """
    Run root cause analysis across all departments.

    Parameters
    ----------
    hospital_data : output from collect_hospital_data()
    anomalies     : output from detect_all_kpi_anomalies()

    Returns
    -------
    Flat sorted list of root cause dicts (critical first).
    """
    departments = hospital_data.get("departments", [])
    all_causes  = []

    for dept in departments:
        causes = _analyze_department(dept, anomalies)
        all_causes.extend(causes)

    severity_order = {"critical": 0, "warning": 1, "info": 2}
    all_causes.sort(key=lambda x: severity_order.get(x["severity"], 9))

    return all_causes
