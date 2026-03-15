# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# anomaly_service.py — M3 rule-based anomaly detection engine
# ─────────────────────────────────────────────────────────────

from datetime import datetime
from core.config import (
    THRESHOLD_BED_OCCUPANCY_WARNING,
    THRESHOLD_BED_OCCUPANCY_CRITICAL,
    THRESHOLD_OPD_WAIT_WARNING,
    THRESHOLD_OPD_WAIT_CRITICAL,
)


def _round(value: float, ndigits: int = 1) -> float:
    """Round helper using integer arithmetic — bypasses Pyre2's broken round() stub."""
    factor: float = 10.0 ** ndigits
    return float(int(value * factor + 0.5)) / factor

def compute_delta_pct(current: float, baseline: float) -> float:
    if baseline == 0:
        return 0.0
    return _round(((current - baseline) / baseline) * 100.0)


def detect_department_anomalies(dept: dict) -> list:
    """
    Run all anomaly rules against a single department
    Returns list of anomaly dicts
    """
    found_anomalies = []
    dept_name       = dept["name"]
    dept_id         = dept["id"]
    timestamp       = datetime.now().isoformat()

    # ── Rule 1 : Bed occupancy ────────────────────────────────
    bed_pct = _round((dept["occupied_beds"] / dept["total_beds"]) * 100.0)

    if bed_pct >= THRESHOLD_BED_OCCUPANCY_CRITICAL:
        found_anomalies.append({
            "anomaly_id"      : f"{dept_id}_bed_critical",
            "type"            : "bed_occupancy",
            "department_id"   : dept_id,
            "department_name" : dept_name,
            "metric"          : "Bed Occupancy",
            "current_value"   : bed_pct,
            "baseline_value"  : 82.0,
            "deviation_pct"   : compute_delta_pct(bed_pct, 82.0),
            "severity"        : "critical",
            "message"         : f"{dept_name} bed occupancy at {bed_pct}% — overflow risk",
            "suggested_action": "Initiate discharge review for stable patients immediately",
            "detected_at"     : timestamp,
        })
    elif bed_pct >= THRESHOLD_BED_OCCUPANCY_WARNING:
        found_anomalies.append({
            "anomaly_id"      : f"{dept_id}_bed_warning",
            "type"            : "bed_occupancy",
            "department_id"   : dept_id,
            "department_name" : dept_name,
            "metric"          : "Bed Occupancy",
            "current_value"   : bed_pct,
            "baseline_value"  : 82.0,
            "deviation_pct"   : compute_delta_pct(bed_pct, 82.0),
            "severity"        : "warning",
            "message"         : f"{dept_name} bed occupancy high at {bed_pct}%",
            "suggested_action": "Monitor closely and prepare discharge plan",
            "detected_at"     : timestamp,
        })

    # ── Rule 2 : OPD wait time ────────────────────────────────
    wait_delta = compute_delta_pct(dept["opd_wait_time_min"], dept["opd_baseline_wait_min"])

    if wait_delta >= 30:
        found_anomalies.append({
            "anomaly_id"      : f"{dept_id}_wait_critical",
            "type"            : "opd_wait",
            "department_id"   : dept_id,
            "department_name" : dept_name,
            "metric"          : "OPD Wait Time",
            "current_value"   : dept["opd_wait_time_min"],
            "baseline_value"  : dept["opd_baseline_wait_min"],
            "deviation_pct"   : wait_delta,
            "severity"        : "critical",
            "message"         : f"{dept_name} OPD wait {dept['opd_wait_time_min']}min — {wait_delta}% above baseline",
            "suggested_action": "Deploy additional triage staff to OPD immediately",
            "detected_at"     : timestamp,
        })
    elif wait_delta >= 15:
        found_anomalies.append({
            "anomaly_id"      : f"{dept_id}_wait_warning",
            "type"            : "opd_wait",
            "department_id"   : dept_id,
            "department_name" : dept_name,
            "metric"          : "OPD Wait Time",
            "current_value"   : dept["opd_wait_time_min"],
            "baseline_value"  : dept["opd_baseline_wait_min"],
            "deviation_pct"   : wait_delta,
            "severity"        : "warning",
            "message"         : f"{dept_name} OPD wait elevated at {dept['opd_wait_time_min']}min",
            "suggested_action": "Review OPD staffing for next shift",
            "detected_at"     : timestamp,
        })

    # ── Rule 3 : ICU full ─────────────────────────────────────
    if dept["icu_beds_total"] > 0:
        if dept["icu_beds_occupied"] >= dept["icu_beds_total"]:
            found_anomalies.append({
                "anomaly_id"      : f"{dept_id}_icu_full",
                "type"            : "icu_capacity",
                "department_id"   : dept_id,
                "department_name" : dept_name,
                "metric"          : "ICU Capacity",
                "current_value"   : dept["icu_beds_occupied"],
                "baseline_value"  : dept["icu_beds_total"],
                "deviation_pct"   : 100.0,
                "severity"        : "critical",
                "message"         : f"{dept_name} ICU fully occupied — no buffer",
                "suggested_action": "Activate overflow ICU protocol immediately",
                "detected_at"     : timestamp,
            })

    # ── Rule 4 : Patient satisfaction drop ───────────────────
    if dept["patient_satisfaction"] <= 3.5:
        found_anomalies.append({
            "anomaly_id"      : f"{dept_id}_satisfaction_low",
            "type"            : "satisfaction",
            "department_id"   : dept_id,
            "department_name" : dept_name,
            "metric"          : "Patient Satisfaction",
            "current_value"   : dept["patient_satisfaction"],
            "baseline_value"  : 4.3,
            "deviation_pct"   : compute_delta_pct(dept["patient_satisfaction"], 4.3),
            "severity"        : "warning",
            "message"         : f"{dept_name} satisfaction score low at {dept['patient_satisfaction']}/5",
            "suggested_action": "Conduct immediate patient feedback review",
            "detected_at"     : timestamp,
        })

    return found_anomalies


def detect_all_anomalies(departments: list) -> list:
    """
    Run anomaly detection across all departments
    Returns flat sorted list — critical first
    """
    all_anomalies = []

    for dept in departments:
        dept_anomalies = detect_department_anomalies(dept)
        all_anomalies.extend(dept_anomalies)

    # Sort: critical first, then warning
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    all_anomalies.sort(key=lambda a: severity_order.get(a["severity"], 3))

    return all_anomalies