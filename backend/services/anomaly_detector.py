# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# services/anomaly_detector.py — KPI Anomaly Detector
# Detects threshold breaches with 15% deviation rule
# Persists anomalies to AnomalyLog table
# ─────────────────────────────────────────────────────────────

from datetime import datetime
from typing import Optional

# KPI threshold map  →  (warning_pct_deviation, critical_pct_deviation, higher_is_worse)
KPI_THRESHOLDS: dict[str, tuple[float, float, bool]] = {
    "bed_occupancy"          : (0.10, 0.15, True),   # >10% warning, >15% critical
    "opd_wait_time"          : (0.15, 0.30, True),
    "lab_tat"                : (0.15, 0.30, True),
    "billing_collection_rate": (0.10, 0.15, False),  # lower than baseline = bad
    "nps"                    : (0.10, 0.15, False),
}

# Hard thresholds (absolute values) for bed_occupancy %
BED_OCC_WARNING  = 80.0
BED_OCC_CRITICAL = 90.0


def _compute_deviation(current: float, baseline: float) -> float:
    """Fractional signed deviation from baseline."""
    if baseline == 0:
        return 0.0
    return (current - baseline) / baseline


def detect_kpi_anomaly(
    kpi_name: str,
    current_value: float,
    baseline: float,
    department_id: Optional[str] = None,
    persist: bool = True,
) -> dict:
    """
    Core anomaly detection logic.

    Parameters
    ----------
    kpi_name      : one of the keys in KPI_THRESHOLDS
    current_value : today's measured value
    baseline      : 7-day rolling average baseline
    department_id : optional department scope
    persist       : if True and anomaly found, write to AnomalyLog table

    Returns
    -------
    {
        "is_anomaly"    : bool,
        "severity"      : "critical" | "warning" | "normal",
        "deviation"     : float,          # fractional
        "deviation_pct" : float,          # percentage
        "kpi_name"      : str,
        "current_value" : float,
        "baseline"      : float,
        "insight"       : str,
        "recommendation": str,
        "department_id" : str | None,
        "detected_at"   : ISO str,
    }
    """
    deviation = _compute_deviation(current_value, baseline)
    abs_dev   = abs(deviation)

    cfg = KPI_THRESHOLDS.get(kpi_name, (0.15, 0.30, True))
    warn_threshold, crit_threshold, higher_is_worse = cfg

    # Determine direction — for "higher is worse" KPIs positive deviation is bad
    bad_direction = (deviation > 0) if higher_is_worse else (deviation < 0)

    if bad_direction and abs_dev >= crit_threshold:
        severity = "critical"
    elif bad_direction and abs_dev >= warn_threshold:
        severity = "warning"
    else:
        severity = "normal"

    is_anomaly = severity != "normal"
    deviation_pct = float(round(deviation * 100, 2))

    # Build human-readable insight and recommendation
    insight, recommendation = _build_insight_and_rec(
        kpi_name, severity, deviation_pct, current_value, baseline, department_id
    )

    result = {
        "is_anomaly"    : is_anomaly,
        "severity"      : severity,
        "deviation"     : float(round(deviation, 4)),
        "deviation_pct" : deviation_pct,
        "kpi_name"      : kpi_name,
        "current_value" : current_value,
        "baseline"      : baseline,
        "insight"       : insight,
        "recommendation": recommendation,
        "department_id" : department_id,
        "detected_at"   : datetime.now().isoformat(),
    }

    # Persist to AnomalyLog if an anomaly was detected
    if is_anomaly and persist:
        _persist_anomaly(result)

    return result


def _build_insight_and_rec(
    kpi_name: str,
    severity: str,
    deviation_pct: float,
    current: float,
    baseline: float,
    dept_id: Optional[str],
) -> tuple[str, str]:
    """Build rule-based human-readable insight and recommendation strings."""
    dept_label = dept_id.replace("_", " ").title() if dept_id else "Hospital-wide"
    direction  = "above" if deviation_pct > 0 else "below"
    abs_pct    = abs(deviation_pct)

    insight_map = {
        "bed_occupancy": (
            f"{dept_label} bed occupancy is {current:.1f}%, which is {abs_pct:.1f}% {direction} "
            f"the {baseline:.1f}% baseline. Overflow risk is {'CRITICAL' if severity=='critical' else 'elevated'}.",
            "Initiate discharge review for stable patients. Consider activating overflow ward if occupancy persists above 90%."
        ),
        "opd_wait_time": (
            f"{dept_label} OPD wait time is {current:.0f} min, {abs_pct:.1f}% {direction} "
            f"the {baseline:.0f}-min baseline. Patient dissatisfaction risk is high.",
            "Deploy additional triage staff immediately. Review appointment scheduling to balance queue load."
        ),
        "lab_tat": (
            f"{dept_label} lab turnaround time is {current:.1f} hrs, {abs_pct:.1f}% {direction} "
            f"the {baseline:.1f}-hr baseline. Lab processing is under pressure.",
            "Add an additional lab technician shift. Review specimen backlog and prioritise critical test orders."
        ),
        "billing_collection_rate": (
            f"{dept_label} billing collection rate is {current:.1f}%, {abs_pct:.1f}% {direction} "
            f"the {baseline:.1f}% target. Revenue leakage detected.",
            "Trigger insurance claim follow-up for pending bills. Review denial patterns with billing team."
        ),
        "nps": (
            f"{dept_label} NPS is {current:.0f}, {abs_pct:.1f}% {direction} "
            f"the {baseline:.0f} baseline. Patient satisfaction is declining.",
            "Conduct immediate patient feedback review. Identify top complaint categories and escalate to department head."
        ),
    }

    default = (
        f"{dept_label} KPI '{kpi_name}' deviated {deviation_pct:+.1f}% from baseline.",
        "Review operational data and escalate to department head."
    )
    return insight_map.get(kpi_name, default)


def _persist_anomaly(result: dict) -> None:
    """Write anomaly result to the AnomalyLog ORM table."""
    try:
        from database.db import SessionLocal
        from models.models import AnomalyLog
        db = SessionLocal()
        log = AnomalyLog(
            kpi_name      = result["kpi_name"],
            department_id = result["department_id"],
            deviation     = result["deviation"],
            detected_at   = datetime.fromisoformat(result["detected_at"]),
            insight       = result["insight"],
            recommendation= result["recommendation"],
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"[AnomalyDetector] DB persist error: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass


def detect_all_kpi_anomalies(hospital_data: dict) -> list[dict]:
    """
    Scan all KPIs across all departments against rolling baselines.

    Accepts the structured dict from collect_hospital_data().
    Returns a flat list of anomaly dicts, sorted critical → warning.
    """
    from data.repository import fetch_trend_data
    trend   = fetch_trend_data()
    results = []

    departments = hospital_data.get("departments", [])

    for dept in departments:
        dept_id   = dept["id"]
        # ---------- Bed Occupancy ----------
        bed_pct   = float(round((dept["occupied_beds"] / dept["total_beds"]) * 100, 1))
        bed_base  = float(round(sum(trend["bed_occupancy"]) / len(trend["bed_occupancy"]), 1))
        r = detect_kpi_anomaly("bed_occupancy", bed_pct, bed_base, dept_id, persist=False)
        if r["is_anomaly"]:
            results.append({**r, "department_name": dept["name"]})

        # ---------- OPD Wait Time ----------
        wait_base = dept.get("opd_baseline_wait_min", 20.0)
        r = detect_kpi_anomaly("opd_wait_time", dept["opd_wait_time_min"], wait_base, dept_id, persist=False)
        if r["is_anomaly"]:
            results.append({**r, "department_name": dept["name"]})

    # Hospital-wide lab TAT
    lab_data = hospital_data.get("lab", {})
    if lab_data.get("avg_tat_hours"):
        r = detect_kpi_anomaly("lab_tat", float(lab_data["avg_tat_hours"]), 4.0, None, persist=False)
        if r["is_anomaly"]:
            results.append({**r, "department_name": "Hospital-wide Lab"})

    # Hospital-wide billing
    billing = hospital_data.get("billing", {})
    if billing.get("collection_rate_pct"):
        r = detect_kpi_anomaly("billing_collection_rate", billing["collection_rate_pct"], 88.0, None, persist=True)
        if r["is_anomaly"]:
            results.append({**r, "department_name": "Hospital-wide Billing"})

    severity_order = {"critical": 0, "warning": 1, "normal": 2}
    results.sort(key=lambda x: severity_order.get(x["severity"], 9))
    return results
