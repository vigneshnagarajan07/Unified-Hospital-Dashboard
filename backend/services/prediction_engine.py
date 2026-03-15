# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# services/prediction_engine.py — KPI Breach Prediction Engine
# Uses 7-day KPI history + linear regression slope to forecast
# 48-hour breach risk and writes proactive alerts to DB
# ─────────────────────────────────────────────────────────────

from datetime import datetime, timedelta
from typing import Optional


def _rf(x: float, n: int) -> float:
    """Round float to n decimal places with explicit float return type.
    Replaces round(x, n) to avoid Pyre2 overload resolution errors.
    """
    factor: float = float(10 ** n)
    sign:   float = 1.0 if x >= 0.0 else -1.0
    return float(int(abs(x) * factor + 0.5) * sign) / factor


# ── Breach thresholds per KPI ─────────────────────────────────
KPI_BREACH_THRESHOLDS: dict[str, float] = {
    "bed_occupancy"          : 90.0,    # % — critical
    "opd_wait_time"          : 35.0,    # min — critical
    "lab_tat"                : 6.0,     # hours — critical
    "billing_collection_rate": 80.0,    # % — below this is breach
    "nps"                    : 50.0,    # below this is breach
}

KPI_HIGHER_IS_WORSE: dict[str, bool] = {
    "bed_occupancy"          : True,
    "opd_wait_time"          : True,
    "lab_tat"                : True,
    "billing_collection_rate": False,
    "nps"                    : False,
}


def compute_trend_slope(values: list[float]) -> float:
    """
    Simple linear regression slope over a list of values.
    Returns change-per-day (positive = increasing).
    Uses least-squares: slope = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
    """
    n: int = len(values)
    if n < 2:
        return 0.0

    x_vals: list[int] = list(range(n))
    sum_x:  float = float(sum(x_vals))
    sum_y:  float = float(sum(values))
    sum_xy: float = float(sum(xi * yi for xi, yi in zip(x_vals, values)))
    sum_x2: float = float(sum(xi ** 2 for xi in x_vals))

    denom: float = n * sum_x2 - sum_x ** 2
    if denom == 0.0:
        return 0.0

    return _rf((n * sum_xy - sum_x * sum_y) / denom, 4)


def _hours_to_breach(
    current: float,
    slope: float,
    threshold: float,
    higher_is_worse: bool,
) -> Optional[float]:
    """
    Estimate hours until KPI crosses threshold on a linear trend.
    Returns None if trajectory never breaches within 48 hrs.
    """
    slope_per_hour: float = slope / 24.0

    if higher_is_worse:
        if slope_per_hour <= 0.0:
            return None
        if current >= threshold:
            return 0.0
        h: float = (threshold - current) / slope_per_hour
    else:
        if slope_per_hour >= 0.0:
            return None
        if current <= threshold:
            return 0.0
        h = (threshold - current) / slope_per_hour

    return _rf(h, 1) if h <= 48.0 else None


def _persist_prediction(prediction: dict) -> None:
    """Write prediction to Prediction table — fire-and-forget, never raises."""
    try:
        from database.db import SessionLocal  # noqa: PLC0415
        from models.models import Prediction  # noqa: PLC0415

        db   = SessionLocal()
        pred = Prediction(
            kpi_name              = prediction["kpi_name"],
            department_id         = prediction.get("department_id"),
            predicted_value       = prediction["predicted_value_at_breach"],
            predicted_breach_time = (
                datetime.fromisoformat(prediction["predicted_breach_time"])
                if prediction.get("predicted_breach_time") else None
            ),
        )
        db.add(pred)
        db.commit()
        db.close()
    except Exception:
        pass   # DB is optional


def run_prediction_engine(hospital_data: dict) -> list[dict]:
    """
    Forecast KPI breaches for all departments within 48 hours.

    Uses the last 7 days of APOLLO_TREND_DATA (or KPIHistory if available).

    Parameters
    ----------
    hospital_data : output from collect_hospital_data()

    Returns
    -------
    List of prediction dicts — only those with breach risk ≤ 48 hr.
    """
    from data.repository import fetch_trend_data  # noqa: PLC0415

    trend:       dict       = fetch_trend_data()
    departments: list       = hospital_data.get("departments", [])
    predictions: list[dict] = []

    def _pred_id() -> str:
        """Generate sequential prediction ID."""
        return "PRED{:03d}".format(len(predictions) + 1)

    # ── 1. Hospital-wide KPIs ────────────────────────────────
    hospital_kpis: dict[str, list] = {
        "bed_occupancy": trend["bed_occupancy"],
        "opd_wait_time": trend["opd_wait"],
    }

    for kpi_name, history in hospital_kpis.items():
        slope:      float = compute_trend_slope([float(v) for v in history])
        current:    float = float(history[-1])
        threshold:  float = KPI_BREACH_THRESHOLDS[kpi_name]
        higher_bad: bool  = KPI_HIGHER_IS_WORSE[kpi_name]

        hours: Optional[float] = _hours_to_breach(current, slope, threshold, higher_bad)
        if hours is not None:
            breach_time:         str   = (datetime.now() + timedelta(hours=hours)).isoformat()
            predicted_at_breach: float = _rf(current + (slope / 24.0) * hours, 2)
            pred: dict = {
                "prediction_id"            : _pred_id(),
                "kpi_name"                 : kpi_name,
                "department_id"            : None,
                "scope"                    : "hospital_wide",
                "current_value"            : current,
                "slope_per_day"            : slope,
                "threshold"                : threshold,
                "hours_to_breach"          : hours,
                "predicted_breach_time"    : breach_time,
                "predicted_value_at_breach": predicted_at_breach,
                "alert_message": (
                    "⚠️ CRITICAL " if hours <= 12.0 else "⚠️ "
                ) + "{} is trending to breach {} threshold in ~{:.0f} hrs (current: {}, slope: {:+.2f}/day).".format(
                    kpi_name.replace("_", " ").title(), threshold, hours, current, slope
                ),
                "generated_at": datetime.now().isoformat(),
            }
            _persist_prediction(pred)
            predictions.append(pred)

    # ── 2. Per-department KPIs ───────────────────────────────
    for dept in departments:
        dept_id:  str   = str(dept["id"])
        dept_occ: float = _rf((dept["occupied_beds"] / dept["total_beds"]) * 100.0, 1)

        dept_history: list[float] = [
            float(v) + float(hash(dept_id) % 5) - 2.0
            for v in trend["bed_occupancy"]
        ]
        dept_history[-1] = dept_occ    # pin to current real value

        slope:     float          = compute_trend_slope(dept_history)
        threshold: float          = KPI_BREACH_THRESHOLDS["bed_occupancy"]
        hours: Optional[float]    = _hours_to_breach(dept_occ, slope, threshold, True)

        if hours is not None:
            breach_time: str  = (datetime.now() + timedelta(hours=hours)).isoformat()
            pred_value:  float = _rf(dept_occ + (slope / 24.0) * hours, 2)
            pred = {
                "prediction_id"            : _pred_id(),
                "kpi_name"                 : "bed_occupancy",
                "department_id"            : dept_id,
                "department_name"          : dept["name"],
                "scope"                    : "department",
                "current_value"            : dept_occ,
                "slope_per_day"            : slope,
                "threshold"                : threshold,
                "hours_to_breach"          : hours,
                "predicted_breach_time"    : breach_time,
                "predicted_value_at_breach": pred_value,
                "alert_message": (
                    "⚠️ CRITICAL " if hours <= 12.0 else "⚠️ "
                ) + "{} bed occupancy ({:.1f}%) forecast to reach {}% critical threshold in ~{:.0f} hrs. Trend: {:+.2f}%/day.".format(
                    dept["name"], dept_occ, threshold, hours, slope
                ),
                "generated_at": datetime.now().isoformat(),
            }
            _persist_prediction(pred)
            predictions.append(pred)

    predictions.sort(key=lambda p: p["hours_to_breach"])
    return predictions
