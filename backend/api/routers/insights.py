# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# insights.py — Anomaly detection, AI insights, and chatbox
# UPDATED: Added /ask endpoint for the Ask-the-Dashboard chatbox
# ─────────────────────────────────────────────────────────────

from fastapi import APIRouter
from pydantic import BaseModel
from services import anomaly_service, ai_service
from data.repository import fetch_all_departments, fetch_hospital_info
from datetime import datetime

router = APIRouter()


@router.get("/anomalies")
def get_anomalies():
    """Scan all departments and return anomaly list."""
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
    """Simulated AI insights based on current anomalies."""
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
    """Actionable recommendations from anomalies."""
    departments     = fetch_all_departments()
    anomalies       = anomaly_service.detect_all_anomalies(departments)
    recommendations = ai_service.generate_recommendations(anomalies)
    return {
        "recommendations" : recommendations,
        "count"           : len(recommendations),
        "timestamp"       : datetime.now().isoformat(),
    }


@router.get("/ai-agent-analysis")
def get_ai_agent_analysis():
    """
    Run the full AI agent pipeline:
    Anomaly detection + KPI analysis + Predictions + AI Summary
    """
    from services.ai_report_service import run_ai_agent_analysis
    analysis = run_ai_agent_analysis()
    return {
        "analysis" : analysis,
        "timestamp": datetime.now().isoformat(),
    }


# ── Ask the Dashboard chatbox ─────────────────────────────────

class AskRequest(BaseModel):
    question: str
    role:     str = "admin"   # which role is asking


@router.post("/ask")
def ask_dashboard(body: AskRequest):
    """
    'Ask the Dashboard' AI chatbox.
    Accepts a natural language question and returns an AI-generated answer
    grounded in live hospital data.

    This was broken before — now uses direct Groq REST API (no SDK).
    """
    # Build hospital context to inject into the prompt
    try:
        departments = fetch_all_departments()
        hospital    = fetch_hospital_info()
        anomalies   = anomaly_service.detect_all_anomalies(departments)

        # Compact context for prompt
        hospital_context = {
            "hospital_name"    : hospital.get("name"),
            "total_beds"       : sum(d["total_beds"] for d in departments),
            "occupied_beds"    : sum(d["occupied_beds"] for d in departments),
            "critical_patients": sum(d["critical_patients"] for d in departments),
            "active_anomalies" : len(anomalies),
            "critical_anomalies": sum(1 for a in anomalies if a["severity"] == "critical"),
            "departments": [
                {
                    "name"         : d["name"],
                    "bed_occupancy": round((d["occupied_beds"] / d["total_beds"]) * 100, 1),
                    "opd_wait_min" : d["opd_wait_time_min"],
                    "satisfaction" : d["patient_satisfaction"],
                }
                for d in departments
            ],
            "anomaly_summaries": [
                {"dept": a.get("department_name"), "issue": a.get("message")}
                for a in anomalies[:3]
            ],
        }
    except Exception:
        hospital_context = {}

    result = ai_service.ask_dashboard(body.question, hospital_context)

    return {
        "question"  : body.question,
        "answer"    : result["answer"],
        "source"    : result["source"],
        "role"      : body.role,
        "timestamp" : datetime.now().isoformat(),
    }
