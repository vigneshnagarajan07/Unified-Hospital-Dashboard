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

router = APIRouter()


@router.get("/summary")
def get_hospital_summary():
    """ Hospital-wide aggregated summary — used by all dashboards """
    departments  = fetch_all_departments()
    hospital     = fetch_hospital_info()
    trend_data   = fetch_trend_data()
    finance      = fetch_finance_data()
    aggregates   = kpi_engine.compute_aggregates(departments)
    health_score = kpi_engine.compute_health_score(aggregates)

    return {
        "hospital"     : hospital,
        "aggregates"   : aggregates,
        "health_score" : health_score,
        "finance"      : finance,
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