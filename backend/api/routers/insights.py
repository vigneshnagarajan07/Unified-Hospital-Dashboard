# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# insights.py — Anomaly detection and AI insight endpoints
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter
from services import anomaly_service, ai_service
from data.repository import fetch_all_departments
from datetime import datetime

router = APIRouter()


@router.get("/anomalies")
def get_anomalies():
    """ Scan all departments and return anomaly list """
    departments = fetch_all_departments()
    anomalies   = anomaly_service.detect_all_anomalies(departments)
    return {
        "anomalies"      : anomalies,
        "total_count"    : len(anomalies),
        "critical_count" : sum(1 for a in anomalies if a["severity"] == "critical"),
        "warning_count"  : sum(1 for a in anomalies if a["severity"] == "warning"),
        "timestamp"      : datetime.now().isoformat(),
    }


@router.get("/ai-insights")
def get_ai_insights():
    """ Simulated AI insights based on current anomalies """
    departments = fetch_all_departments()
    anomalies   = anomaly_service.detect_all_anomalies(departments)
    insights    = ai_service.generate_insights(departments, anomalies)
    return {
        "insights"  : insights,
        "count"     : len(insights),
        "timestamp" : datetime.now().isoformat(),
    }


@router.get("/recommendations")
def get_recommendations():
    """ Actionable recommendations from anomalies """
    departments     = fetch_all_departments()
    anomalies       = anomaly_service.detect_all_anomalies(departments)
    recommendations = ai_service.generate_recommendations(anomalies)
    return {
        "recommendations" : recommendations,
        "count"           : len(recommendations),
        "timestamp"       : datetime.now().isoformat(),
    }