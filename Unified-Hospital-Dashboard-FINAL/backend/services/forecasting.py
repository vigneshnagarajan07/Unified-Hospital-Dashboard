# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# forecasting.py — M7 rule-based 48hr forecast engine
# No ML needed — projects from 7-day trend + day patterns
# ─────────────────────────────────────────────────────────────

from datetime import datetime, timedelta
from services.kpi_engine import compute_aggregates


# ── Day-of-week load multipliers (Mon=0, Sun=6) ───────────────
DAY_LOAD_MULTIPLIER = {
    0: 1.10,  # Monday   — high
    1: 1.05,  # Tuesday
    2: 1.00,  # Wednesday
    3: 0.98,  # Thursday
    4: 1.08,  # Friday   — high
    5: 0.85,  # Saturday — lower
    6: 0.75,  # Sunday   — lowest
}


def _round(value: float, ndigits: int = 1) -> float:
    """Round helper using integer arithmetic — bypasses Pyre2's broken round() stub."""
    factor: float = 10.0 ** ndigits
    return float(int(value * factor + 0.5)) / factor


def _clamp(value: float, lo: float, hi: float) -> float:
    """Clamp a float value between lo and hi."""
    if value < lo:
        return lo
    if value > hi:
        return hi
    return value


def compute_trend_slope(values: list) -> float:
    """
    Simple linear trend slope from last 7 days
    Positive = increasing, Negative = decreasing
    """
    if len(values) < 2:
        return 0.0
    total_change = sum(
        values[i] - values[i - 1]
        for i in range(1, len(values))
    )
    return total_change / (len(values) - 1)


def generate_48hr_forecast(departments: list, trend_data: dict) -> dict:
    """
    Generate 48-hour forecast in 6-hour intervals
    Returns 8 forecast points with confidence bands
    """
    aggregates     = compute_aggregates(departments)
    current_time   = datetime.now()

    # Current values
    current_bed_occupancy = aggregates["bed_occupancy_pct"]
    current_opd_patients  = aggregates["total_opd_patients"]
    current_wait_time     = aggregates["avg_opd_wait_min"]

    # Trend slopes from last 7 days
    bed_slope     = compute_trend_slope(trend_data["bed_occupancy"])
    patient_slope = compute_trend_slope(trend_data["patients"])
    wait_slope    = compute_trend_slope(trend_data["opd_wait"])

    # Generate 8 forecast points (6-hour intervals = 48 hours)
    forecast_points = []

    for interval_index in range(8):

        hours_ahead     = (interval_index + 1) * 6
        forecast_time   = current_time + timedelta(hours=hours_ahead)
        day_of_week     = forecast_time.weekday()
        hour_of_day     = forecast_time.hour
        load_multiplier = DAY_LOAD_MULTIPLIER.get(day_of_week, 1.0)

        # Night hours (22:00 - 06:00) have lower OPD load
        if hour_of_day >= 22 or hour_of_day < 6:
            time_multiplier = 0.6
        elif 6 <= hour_of_day < 10:
            time_multiplier = 0.9
        elif 10 <= hour_of_day < 16:
            time_multiplier = 1.1   # peak hours
        else:
            time_multiplier = 1.0

        combined_multiplier = load_multiplier * time_multiplier

        # Forecast values
        projected_bed = round(
            current_bed_occupancy + bed_slope * (hours_ahead / 24) * combined_multiplier, 1
        )
        projected_patients = round(
            current_opd_patients * combined_multiplier + patient_slope * (hours_ahead / 24)
        )
        projected_wait = round(
            current_wait_time * combined_multiplier + wait_slope * (hours_ahead / 24), 1
        )

        # Clamp values to realistic bounds
        projected_bed      = max(40, min(100, projected_bed))
        projected_patients = max(100, min(800, projected_patients))
        projected_wait     = max(5, min(90, projected_wait))

        # Confidence band widens further into future
        confidence_margin = 2.0 + interval_index * 0.8

        # Alert if forecast breaches threshold
        forecast_alerts = []
        if projected_bed >= 90:
            forecast_alerts.append({
                "metric"  : "bed_occupancy",
                "message" : f"Bed occupancy forecast to reach {projected_bed}%",
                "severity": "critical",
            })
        if projected_wait >= 35:
            forecast_alerts.append({
                "metric"  : "opd_wait",
                "message" : f"OPD wait forecast to reach {projected_wait} min",
                "severity": "critical",
            })

        forecast_points.append({
            "interval_index"    : interval_index,
            "hours_ahead"       : hours_ahead,
            "forecast_time"     : forecast_time.strftime("%d %b %H:%M"),
            "bed_occupancy"     : projected_bed,
            "bed_upper"         : _round(_clamp(float(projected_bed) + confidence_margin, 0.0, 100.0)),
            "bed_lower"         : _round(_clamp(float(projected_bed) - confidence_margin, 0.0, 100.0)),
            "opd_patients"      : projected_patients,
            "patients_upper"    : projected_patients + int(confidence_margin * 10),
            "patients_lower"    : max(projected_patients - int(confidence_margin * 10), 0),
            "opd_wait_min"      : projected_wait,
            "wait_upper"        : _round(float(projected_wait) + confidence_margin),
            "wait_lower"        : _round(_clamp(float(projected_wait) - confidence_margin, 0.0, 99999.0)),
            "load_level"        : "high" if combined_multiplier > 1.05 else "normal" if combined_multiplier > 0.9 else "low",
            "alerts"            : forecast_alerts,
        })

    return {
        "current"         : {
            "bed_occupancy" : current_bed_occupancy,
            "opd_patients"  : current_opd_patients,
            "opd_wait_min"  : current_wait_time,
        },
        "forecast_points" : forecast_points,
        "horizon_hours"   : 48,
        "generated_at"    : current_time.isoformat(),
    }