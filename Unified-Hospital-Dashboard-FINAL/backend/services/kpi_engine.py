# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# kpi_engine.py — M1 + M2 business logic
# Computes aggregates, KPIs, health score from department data
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


def compute_percentage(numerator, denominator):
    if denominator == 0:
        return 0.0
    return round((numerator / denominator) * 100, 1)


def compute_delta(current_value, baseline_value):
    if baseline_value == 0:
        return 0.0
    return round(((current_value - baseline_value) / baseline_value) * 100, 1)


def get_metric_status(metric_name, value):
    """
    Returns normal / warning / critical based on metric thresholds
    """
    if metric_name == "bed_occupancy":
        if value >= THRESHOLD_BED_OCCUPANCY_CRITICAL : return "critical"
        if value >= THRESHOLD_BED_OCCUPANCY_WARNING  : return "warning"
        return "normal"

    if metric_name == "opd_wait":
        if value >= THRESHOLD_OPD_WAIT_CRITICAL : return "critical"
        if value >= THRESHOLD_OPD_WAIT_WARNING  : return "warning"
        return "normal"

    if metric_name == "satisfaction":
        if value <= 3.5 : return "critical"
        if value <= 4.0 : return "warning"
        return "normal"

    if metric_name == "surgery_rate":
        if value < 65 : return "critical"
        if value < 80 : return "warning"
        return "normal"

    return "normal"


def compute_aggregates(departments: list) -> dict:
    """
    Compute hospital-wide aggregate numbers from department list
    """
    total_beds      = sum(d["total_beds"]           for d in departments)
    occupied_beds   = sum(d["occupied_beds"]         for d in departments)
    total_patients  = sum(d["opd_patients_today"]    for d in departments)
    total_doctors   = sum(d["staff_doctors"]          for d in departments)
    total_nurses    = sum(d["staff_nurses"]           for d in departments)
    total_critical  = sum(d["critical_patients"]      for d in departments)
    total_scheduled = sum(d["surgeries_scheduled"]    for d in departments)
    total_completed = sum(d["surgeries_completed"]    for d in departments)
    avg_wait        = _round(float(sum(d["opd_wait_time_min"] for d in departments)) / len(departments))
    avg_satisfaction= _round(float(sum(d["patient_satisfaction"] for d in departments)) / len(departments), 2)
    bed_occupancy   = compute_percentage(occupied_beds, total_beds)
    surgery_rate    = compute_percentage(total_completed, total_scheduled) if total_scheduled > 0 else 100.0

    return {
        "total_beds"           : total_beds,
        "occupied_beds"        : occupied_beds,
        "bed_occupancy_pct"    : bed_occupancy,
        "total_opd_patients"   : total_patients,
        "total_staff"          : total_doctors + total_nurses,
        "total_doctors"        : total_doctors,
        "total_nurses"         : total_nurses,
        "critical_patients"    : total_critical,
        "surgeries_scheduled"  : total_scheduled,
        "surgeries_completed"  : total_completed,
        "surgery_completion_rate": surgery_rate,
        "avg_opd_wait_min"     : avg_wait,
        "avg_satisfaction"     : avg_satisfaction,
        "departments_count"    : len(departments),
    }


def compute_health_score(aggregates: dict) -> dict:
    """
    Compute hospital health score 0-100 as weighted average
    """
    bed_score      = 100 - aggregates["bed_occupancy_pct"]
    wait_score     = 100 - min(aggregates["avg_opd_wait_min"], 60) / 60 * 100
    sat_score      = aggregates["avg_satisfaction"] * 20
    surgery_score  = aggregates["surgery_completion_rate"]

    raw_score: float = (
        float(bed_score)     * 0.30 +
        float(wait_score)    * 0.25 +
        float(sat_score)     * 0.25 +
        float(surgery_score) * 0.20
    )
    score = _round(raw_score)
    clamped: float = float(raw_score)
    if clamped < 0.0:
        clamped = 0.0
    if clamped > 100.0:
        clamped = 100.0
    score = _round(clamped)

    grade = "A" if score >= 85 else "B" if score >= 70 else "C" if score >= 55 else "D"
    label = "Excellent" if score >= 85 else "Good" if score >= 70 else "Needs Attention" if score >= 55 else "Critical"

    return { "score": score, "grade": grade, "label": label }


def enrich_single_department(dept: dict) -> dict:
    """
    Add computed metrics + anomaly flags to a single department
    """
    bed_pct       = compute_percentage(dept["occupied_beds"], dept["total_beds"])
    wait_delta    = compute_delta(dept["opd_wait_time_min"], dept["opd_baseline_wait_min"])
    surgery_rate  = compute_percentage(dept["surgeries_completed"], dept["surgeries_scheduled"]) \
                    if dept["surgeries_scheduled"] > 0 else None

    anomalies = []

    # Check OPD wait anomaly
    if wait_delta >= 30:
        anomalies.append({
            "type"     : "opd_wait",
            "message"  : f"OPD wait {wait_delta}% above baseline",
            "severity" : "critical",
        })
    elif wait_delta >= 15:
        anomalies.append({
            "type"     : "opd_wait",
            "message"  : f"OPD wait {wait_delta}% above baseline",
            "severity" : "warning",
        })

    # Check bed occupancy anomaly
    if bed_pct >= 95:
        anomalies.append({
            "type"     : "bed_occupancy",
            "message"  : f"Bed occupancy critical at {bed_pct}%",
            "severity" : "critical",
        })
    elif bed_pct >= 85:
        anomalies.append({
            "type"     : "bed_occupancy",
            "message"  : f"Bed occupancy high at {bed_pct}%",
            "severity" : "warning",
        })

    dept_status = "critical" if any(a["severity"] == "critical" for a in anomalies) \
                 else "warning" if anomalies else "normal"

    return {
        **dept,
        "bed_occupancy_pct"      : bed_pct,
        "wait_delta_pct"         : wait_delta,
        "surgery_completion_rate": surgery_rate,
        "anomalies"              : anomalies,
        "status"                 : dept_status,
    }


def enrich_departments(departments: list) -> list:
    return [enrich_single_department(dept) for dept in departments]


def compute_kpis(departments: list, trend_data: dict) -> dict:
    """
    Compute full KPI card data with trends, deltas, status
    """
    aggregates = compute_aggregates(departments)

    kpi_list = [
        {
            "id"               : "bed_occupancy",
            "label"            : "Bed Occupancy",
            "value"            : aggregates["bed_occupancy_pct"],
            "unit"             : "%",
            "baseline"         : 82.0,
            "delta_pct"        : compute_delta(aggregates["bed_occupancy_pct"], 82.0),
            "status"           : get_metric_status("bed_occupancy", aggregates["bed_occupancy_pct"]),
            "trend"            : trend_data["bed_occupancy"],
            "dates"            : trend_data["dates"],
            "higher_is_worse"  : True,
            "icon"             : "bed",
            "description"      : f"{aggregates['occupied_beds']} of {aggregates['total_beds']} beds occupied",
        },
        {
            "id"               : "opd_wait",
            "label"            : "Avg OPD Wait",
            "value"            : aggregates["avg_opd_wait_min"],
            "unit"             : " min",
            "baseline"         : 20.0,
            "delta_pct"        : compute_delta(aggregates["avg_opd_wait_min"], 20.0),
            "status"           : get_metric_status("opd_wait", aggregates["avg_opd_wait_min"]),
            "trend"            : trend_data["opd_wait"],
            "dates"            : trend_data["dates"],
            "higher_is_worse"  : True,
            "icon"             : "clock",
            "description"      : "Average across all OPDs",
        },
        {
            "id"               : "surgery_rate",
            "label"            : "Surgery Completion",
            "value"            : aggregates["surgery_completion_rate"],
            "unit"             : "%",
            "baseline"         : 90.0,
            "delta_pct"        : compute_delta(aggregates["surgery_completion_rate"], 90.0),
            "status"           : get_metric_status("surgery_rate", aggregates["surgery_completion_rate"]),
            "trend"            : trend_data["surgery_rate"],
            "dates"            : trend_data["dates"],
            "higher_is_worse"  : False,
            "icon"             : "scissors",
            "description"      : f"{aggregates['surgeries_completed']} of {aggregates['surgeries_scheduled']} done",
        },
        {
            "id"               : "satisfaction",
            "label"            : "Patient Satisfaction",
            "value"            : aggregates["avg_satisfaction"],
            "unit"             : "/5",
            "baseline"         : 4.3,
            "delta_pct"        : compute_delta(aggregates["avg_satisfaction"], 4.3),
            "status"           : get_metric_status("satisfaction", aggregates["avg_satisfaction"]),
            "trend"            : trend_data["satisfaction"],
            "dates"            : trend_data["dates"],
            "higher_is_worse"  : False,
            "icon"             : "smile",
            "description"      : "Average across all departments",
        },
        {
            "id"               : "total_patients",
            "label"            : "OPD Patients Today",
            "value"            : aggregates["total_opd_patients"],
            "unit"             : "",
            "baseline"         : 550,
            "delta_pct"        : compute_delta(aggregates["total_opd_patients"], 550),
            "status"           : "normal",
            "trend"            : trend_data["patients"],
            "dates"            : trend_data["dates"],
            "higher_is_worse"  : False,
            "icon"             : "users",
            "description"      : "Total across all OPDs",
        },
    ]

    return {
        "kpis"         : kpi_list,
        "health_score" : compute_health_score(aggregates),
        "timestamp"    : datetime.now().isoformat(),
    }