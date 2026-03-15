# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# analytics.py — KPI, summary and forecast endpoints
# Used by: Admin, Department Head dashboards
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends
from core.security import require_role
from services import kpi_engine, forecasting
from data.repository import (
    fetch_all_departments,
    fetch_hospital_info,
    fetch_trend_data,
    fetch_finance_data,
)
from datetime import datetime
from database.db import get_db
from sqlalchemy.orm import Session

router = APIRouter()


def _enrich_finance_from_db(db: Session) -> dict:
    """Pull live billing totals from workflow DB to enrich finance summary."""
    try:
        from models.workflow_models import BillingTransaction, WorkflowPatient
        txns    = db.query(BillingTransaction).all()
        patients= db.query(WorkflowPatient).all()
        total   = sum(t.amount for t in txns)
        by_cat  = {}
        for t in txns:
            by_cat[t.category] = by_cat.get(t.category, 0) + t.amount
        return {
            "live_total_billed_inr":    round(total, 2),
            "live_revenue_by_category": {k: round(v, 2) for k, v in by_cat.items()},
            "live_admitted_patients":   sum(1 for p in patients if p.status == "admitted"),
            "live_discharged_patients": sum(1 for p in patients if p.status == "discharged"),
        }
    except Exception:
        return {}


@router.get("/summary")
def get_hospital_summary(db: Session = Depends(get_db)):
    """ Hospital-wide aggregated summary — used by all dashboards """
    departments  = fetch_all_departments()
    hospital     = fetch_hospital_info()
    trend_data   = fetch_trend_data()
    finance      = fetch_finance_data()
    aggregates   = kpi_engine.compute_aggregates(departments)
    health_score = kpi_engine.compute_health_score(aggregates)
    live_finance = _enrich_finance_from_db(db)

    return {
        "hospital"     : hospital,
        "aggregates"   : aggregates,
        "health_score" : health_score,
        "finance"      : {**finance, **live_finance},
        "trends"       : trend_data,
        "timestamp"    : datetime.now().isoformat(),
    }


@router.get("/departments")
def get_all_departments():
    """ All departments with computed metrics and anomaly flags """
    departments = fetch_all_departments()
    return {
        "departments" : kpi_engine.enrich_departments(departments),
        "timestamp"   : datetime.now().isoformat(),
    }


@router.get("/departments/{department_id}")
def get_single_department(department_id: str):
    """ Single department deep-dive """
    from data.repository import fetch_department_by_id
    dept = fetch_department_by_id(department_id)
    if not dept:
        return {"error": f"Department '{department_id}' not found"}
    return kpi_engine.enrich_single_department(dept)


@router.get("/kpis")
def get_kpis():
    """ Computed KPI cards with trends and status """
    departments = fetch_all_departments()
    trend_data  = fetch_trend_data()
    return kpi_engine.compute_kpis(departments, trend_data)


@router.get("/forecast")
def get_forecast():
    """ 48-hour predictive forecast in 6-hour intervals """
    departments = fetch_all_departments()
    trend_data  = fetch_trend_data()
    return forecasting.generate_48hr_forecast(departments, trend_data)