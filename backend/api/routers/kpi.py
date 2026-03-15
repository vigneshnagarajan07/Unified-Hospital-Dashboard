# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# api/routers/kpi.py — KPI data endpoints
# UPDATED: Reads from KPIHistory (models/models.py) which is
#          seeded on startup with 30-day per-department data.
# GET /api/kpi/weekly   →  30-day data per dept
# GET /api/kpi/today    →  today's data with anomaly flags
# ─────────────────────────────────────────────────────────────

from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.db import get_db
from models.models import KPIHistory, Department

router = APIRouter()

THRESHOLDS = {
    "bed_occupancy":           {"warning": 85,  "critical": 92,  "higher_is_worse": True},
    "opd_wait_time":           {"warning": 35,  "critical": 50,  "higher_is_worse": True},
    "billing_collection_rate": {"warning": 83,  "critical": 78,  "higher_is_worse": False},
    "lab_tat":                 {"warning": 5.5, "critical": 7.0, "higher_is_worse": True},
    "nps":                     {"warning": 65,  "critical": 55,  "higher_is_worse": False},
}

KPI_LABELS = {
    "bed_occupancy":           "Bed Occupancy",
    "opd_wait_time":           "OPD Wait Time",
    "billing_collection_rate": "Billing Collection Rate",
    "lab_tat":                 "Lab TAT",
    "nps":                     "NPS Score",
}

KPI_UNITS = {
    "bed_occupancy":           "%",
    "opd_wait_time":           "min",
    "billing_collection_rate": "%",
    "lab_tat":                 "hrs",
    "nps":                     "pts",
}

METRICS = ["bed_occupancy", "opd_wait_time", "billing_collection_rate", "lab_tat", "nps"]


def _get_status(metric: str, value: float) -> str:
    if value is None:
        return "normal"
    t   = THRESHOLDS.get(metric, {})
    hiw = t.get("higher_is_worse", True)
    if hiw:
        if value >= t.get("critical", 999): return "critical"
        if value >= t.get("warning",  999): return "warning"
    else:
        if value <= t.get("critical", -1):  return "critical"
        if value <= t.get("warning",  -1):  return "warning"
    return "normal"


def _anomaly_flag(metric: str, today_val: float, baseline: float):
    if baseline is None or baseline == 0 or today_val is None:
        return None
    deviation = ((today_val - baseline) / baseline) * 100
    t   = THRESHOLDS.get(metric, {})
    hiw = t.get("higher_is_worse", True)
    threshold_breach = (hiw and today_val >= t.get("warning", 999)) or \
                       (not hiw and today_val <= t.get("warning", -1))
    if not (threshold_breach or abs(deviation) >= 15):
        return None
    return {
        "deviation_pct": round(deviation, 1),
        "status":        _get_status(metric, today_val),
        "baseline":      round(baseline, 1),
    }


def _row_to_dict(row: KPIHistory) -> dict:
    return {
        "date":                    row.date.isoformat() if row.date else None,
        "bed_occupancy":           row.bed_occupancy,
        "opd_wait_time":           row.opd_wait_time,
        "billing_collection_rate": row.billing_collection_rate,
        "lab_tat":                 row.lab_tat,
        "nps":                     row.nps,
    }


@router.get("/weekly")
def get_weekly_kpis(db: Session = Depends(get_db)):
    """30-day KPI history grouped by department."""
    cutoff = date.today() - timedelta(days=29)
    rows   = (
        db.query(KPIHistory)
        .filter(KPIHistory.date >= cutoff)
        .order_by(KPIHistory.department_id, KPIHistory.date)
        .all()
    )

    # Enrich with department names
    depts = {d.id: d.name for d in db.query(Department).all()}

    by_dept: dict = {}
    for row in rows:
        dept_key = depts.get(row.department_id, row.department_id)
        by_dept.setdefault(dept_key, [])
        by_dept[dept_key].append(_row_to_dict(row))

    return {
        "departments": by_dept,
        "days":        30,
        "dept_ids":    list(set(r.department_id for r in rows)),
    }


@router.get("/today")
def get_today_kpis(db: Session = Depends(get_db)):
    """Latest KPIs per department with anomaly detection vs 7-day baseline."""
    today  = date.today()
    cutoff = today - timedelta(days=7)

    depts  = {d.id: d.name for d in db.query(Department).all()}

    # Get latest record per department (today or most recent)
    subq   = (
        db.query(KPIHistory.department_id, func.max(KPIHistory.date).label("max_date"))
        .group_by(KPIHistory.department_id)
        .subquery()
    )
    latest_rows = (
        db.query(KPIHistory)
        .join(subq, (KPIHistory.department_id == subq.c.department_id) &
                    (KPIHistory.date == subq.c.max_date))
        .all()
    )

    # 7-day baselines
    baseline_q = (
        db.query(
            KPIHistory.department_id,
            func.avg(KPIHistory.bed_occupancy).label("bed_occupancy"),
            func.avg(KPIHistory.opd_wait_time).label("opd_wait_time"),
            func.avg(KPIHistory.billing_collection_rate).label("billing_collection_rate"),
            func.avg(KPIHistory.lab_tat).label("lab_tat"),
            func.avg(KPIHistory.nps).label("nps"),
        )
        .filter(KPIHistory.date >= cutoff, KPIHistory.date < today)
        .group_by(KPIHistory.department_id)
        .all()
    )
    baselines = {r.department_id: r for r in baseline_q}

    result = []
    for row in latest_rows:
        b      = baselines.get(row.department_id)
        kpis   = []
        anomalies = []
        for m in METRICS:
            val  = getattr(row, m)
            base = getattr(b, m) if b else None
            kpis.append({
                "metric":          m,
                "label":           KPI_LABELS[m],
                "unit":            KPI_UNITS[m],
                "value":           round(val, 1) if val is not None else None,
                "baseline":        round(base, 1) if base is not None else None,
                "status":          _get_status(m, val),
                "higher_is_worse": THRESHOLDS.get(m, {}).get("higher_is_worse", True),
            })
            flag = _anomaly_flag(m, val, base)
            if flag:
                anomalies.append({
                    "metric":        m,
                    "label":         KPI_LABELS[m],
                    **flag,
                    "current_value": round(val, 1),
                    "unit":          KPI_UNITS[m],
                })
        result.append({
            "department":      row.department_id,
            "department_name": depts.get(row.department_id, row.department_id),
            "date":            row.date.isoformat(),
            "kpis":            kpis,
            "anomalies":       anomalies,
        })

    return {"departments": result, "date": today.isoformat()}
