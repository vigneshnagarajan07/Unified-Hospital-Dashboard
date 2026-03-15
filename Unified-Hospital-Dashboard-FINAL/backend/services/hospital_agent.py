# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# services/hospital_agent.py — Central Orchestration Agent
#
# DB is OPTIONAL — all role dashboards work from in-memory data.
# Persist calls are fire-and-forget with full error isolation.
#
# PIPELINE:
#   1. collect_hospital_data()    → raw aggregated data
#   2. compute KPIs               → kpi_engine
#   3. detect anomalies           → anomaly_detector
#   4. root cause analysis        → root_cause_engine
#   5. generate insights          → insight_engine
#   6. generate recommendations   → recommendation_engine
#   7. run prediction engine      → prediction_engine
#   8. (optional) persist to DB
#   9. return structured dashboard dict
# ─────────────────────────────────────────────────────────────

from datetime import datetime, date

from services.data_aggregator      import collect_hospital_data
from services.anomaly_detector     import detect_all_kpi_anomalies
from services.root_cause_engine    import analyze_root_causes
from services.insight_engine       import generate_insights
from services.recommendation_engine import generate_recommendations
from services.prediction_engine    import run_prediction_engine
from services                      import kpi_engine
from data.repository               import fetch_trend_data


# ─────────────────────────────────────────────────────────────
# Core pipeline — no DB dependency
# ─────────────────────────────────────────────────────────────

def run_hospital_agent(query_date: date | None = None) -> dict:
    """
    Execute the full intelligence pipeline.
    Returns a complete structured dashboard payload.
    All steps are pure in-memory; DB persist is attempted but never
    blocks or crashes the response.
    """
    pipeline_start = datetime.now()
    query_date     = query_date or date.today()

    # Step 1 — Collect
    hospital_data = collect_hospital_data(query_date)
    departments   = hospital_data["departments"]

    # Step 2 — KPIs
    trend_data   = fetch_trend_data()
    kpis         = kpi_engine.compute_kpis(departments, trend_data)
    aggregates   = kpi_engine.compute_aggregates(departments)
    health_score = kpi_engine.compute_health_score(aggregates)
    enriched     = kpi_engine.enrich_departments(departments)

    # Step 3 — Anomaly detection (persist=False keeps it fast)
    anomalies = detect_all_kpi_anomalies(hospital_data)

    # Step 4 — Root causes
    root_causes = analyze_root_causes(hospital_data, anomalies)

    # Step 5 — Insights
    insights = generate_insights(hospital_data, anomalies, root_causes)

    # Step 6 — Recommendations
    recommendations = generate_recommendations(anomalies, root_causes)

    # Step 7 — Predictions
    predictions = run_prediction_engine(hospital_data)

    # Step 8 — Optional DB persist (silent on failure)
    _try_persist_kpi_snapshot(aggregates, query_date)

    pipeline_end = datetime.now()
    duration_ms  = round((pipeline_end - pipeline_start).total_seconds() * 1000, 1)

    return {
        "metadata": {
            "pipeline_date" : str(query_date),
            "collected_at"  : hospital_data["collected_at"],
            "pipeline_start": pipeline_start.isoformat(),
            "pipeline_end"  : pipeline_end.isoformat(),
            "duration_ms"   : duration_ms,
            "version"       : "2.0.0",
            "agent"         : "GKM_8 Hospital Intelligence Agent",
        },
        "hospital_data": {
            "beds"        : hospital_data["beds"],
            "opd"         : hospital_data["opd"],
            "billing"     : hospital_data["billing"],
            "lab"         : hospital_data["lab"],
            "satisfaction": hospital_data["satisfaction"],
        },
        "kpis"           : kpis,
        "health_score"   : health_score,
        "aggregates"     : aggregates,
        "departments"    : enriched,
        "anomalies"      : anomalies,
        "root_causes"    : root_causes,
        "insights"       : insights,
        "recommendations": recommendations,
        "predictions"    : predictions,
    }


def _try_persist_kpi_snapshot(aggregates: dict, snapshot_date: date) -> None:
    """Fire-and-forget DB write — never raises, never blocks."""
    try:
        from database.db import SessionLocal
        from models.models import KPIHistory
        from data.repository import fetch_finance_data

        finance = fetch_finance_data()
        db      = SessionLocal()
        existing = (
            db.query(KPIHistory)
            .filter(KPIHistory.date == snapshot_date,
                    KPIHistory.department_id == "cardiology")
            .first()
        )
        if not existing:
            db.add(KPIHistory(
                department_id          = "cardiology",
                date                   = snapshot_date,
                bed_occupancy          = aggregates.get("bed_occupancy_pct"),
                opd_wait_time          = aggregates.get("avg_opd_wait_min"),
                billing_collection_rate= finance.get("insurance_claims_pct"),
            ))
            db.commit()
        db.close()
    except Exception:
        pass   # DB is optional — silence all errors


# ─────────────────────────────────────────────────────────────
# Role-scoped dashboard helpers
# ─────────────────────────────────────────────────────────────

def get_admin_dashboard() -> dict:
    """
    Admin / CEO — full hospital KPIs, anomalies, predictions, actions.
    """
    result = run_hospital_agent()
    return {
        "role"           : "admin",
        "metadata"       : result["metadata"],
        "health_score"   : result["health_score"],
        "kpis"           : result["kpis"],
        "aggregates"     : result["aggregates"],
        "anomaly_alerts" : result["anomalies"],
        "predicted_risks": result["predictions"],
        "recommendations": result["recommendations"],
        "insights"       : result["insights"],
        "hospital_data"  : result["hospital_data"],
    }


def get_department_dashboard(department_id: str) -> dict:
    """
    Department Head — department KPIs, alerts, root causes, recommendations.
    """
    result = run_hospital_agent()

    dept_anomalies    = [a for a in result["anomalies"]
                         if a.get("department_id") == department_id]
    dept_root_causes  = [r for r in result["root_causes"]
                         if r.get("department_id") == department_id]
    dept_recommendations = [r for r in result["recommendations"]
                            if r.get("department_id") == department_id]
    dept_insights     = [i for i in result["insights"]
                         if department_id.replace("_", " ").lower()
                         in i.get("department", "").lower()
                         or "hospital" in i.get("department", "").lower()]
    dept_enriched     = next(
        (d for d in result["departments"] if d["id"] == department_id), None
    )
    dept_predictions  = [p for p in result["predictions"]
                         if p.get("department_id") == department_id]

    return {
        "role"           : "department_head",
        "department_id"  : department_id,
        "metadata"       : result["metadata"],
        "department_kpis": dept_enriched,
        "anomaly_alerts" : dept_anomalies,
        "root_causes"    : dept_root_causes,
        "recommendations": dept_recommendations,
        "insights"       : dept_insights,
        "predictions"    : dept_predictions,
    }


def get_doctor_dashboard(doctor_id: str) -> dict:
    """
    Doctor — shift schedule, patient queue, department alerts.
    """
    from data.repository import (
        fetch_staff_by_id, fetch_patients_by_doctor, fetch_department_by_id,
    )

    doctor = fetch_staff_by_id(doctor_id)
    if not doctor:
        return {"error": f"Doctor '{doctor_id}' not found"}

    dept_id    = doctor.get("department_id", "")
    patients   = fetch_patients_by_doctor(doctor_id)
    department = fetch_department_by_id(dept_id)

    # Lightweight anomaly scan (in-memory only)
    hospital_data  = collect_hospital_data()
    all_anomalies  = detect_all_kpi_anomalies(hospital_data)
    dept_alerts    = [a for a in all_anomalies if a.get("department_id") == dept_id]

    return {
        "role"            : "doctor",
        "doctor_id"       : doctor_id,
        "doctor_name"     : doctor.get("name"),
        "designation"     : doctor.get("designation"),
        "department_id"   : dept_id,
        "department_name" : department.get("name") if department else dept_id,
        "specialization"  : doctor.get("specialization"),
        "experience_years": doctor.get("experience_years"),
        "contact"         : doctor.get("contact"),
        "schedule": {
            "shift"          : doctor.get("shift"),
            "shift_time"     : doctor.get("shift_time"),
            "on_duty_today"  : doctor.get("on_duty_today"),
            "patients_count" : len(patients),
        },
        "patient_queue": [
            {
                "patient_id"  : p["patient_id"],
                "name"        : p["name"],
                "age"         : p.get("age"),
                "gender"      : p.get("gender"),
                "diagnosis"   : p.get("diagnosis"),
                "ward"        : p.get("ward"),
                "bed_number"  : p.get("bed_number"),
                "is_critical" : p.get("is_critical", False),
                "status"      : p.get("status"),
                "admission_date": p.get("admission_date"),
                "expected_discharge": p.get("expected_discharge"),
            }
            for p in patients
        ],
        "department_alerts": dept_alerts,
        "timestamp"        : datetime.now().isoformat(),
    }


def get_patient_dashboard(patient_id: str) -> dict:
    """
    Patient — appointments, lab results, billing, vitals, feedback slot.
    """
    from data.repository import fetch_patient_by_id

    patient = fetch_patient_by_id(patient_id)
    if not patient:
        return {"error": f"Patient '{patient_id}' not found"}

    checklist  = patient.get("discharge_checklist", [])
    done       = sum(1 for t in checklist if t.get("completed"))
    total      = len(checklist)

    return {
        "role"              : "patient",
        "patient_id"        : patient_id,
        "patient_name"      : patient.get("name"),
        "age"               : patient.get("age"),
        "gender"            : patient.get("gender"),
        "blood_group"       : patient.get("blood_group"),
        "department"        : patient.get("department_name"),
        "assigned_doctor"   : patient.get("assigned_doctor"),
        "ward"              : patient.get("ward"),
        "bed_number"        : patient.get("bed_number"),
        "diagnosis"         : patient.get("diagnosis"),
        "admission_date"    : patient.get("admission_date"),
        "expected_discharge": patient.get("expected_discharge"),
        "status"            : patient.get("status"),
        "is_critical"       : patient.get("is_critical", False),
        "appointments"      : [],
        "lab_results"       : patient.get("lab_reports", []),
        "billing_summary"   : patient.get("bill_estimate", {}),
        "vitals"            : patient.get("vitals", []),
        "prescriptions"     : patient.get("prescriptions", []),
        "discharge_checklist": checklist,
        "discharge_progress": {
            "tasks_done"    : done,
            "tasks_total"   : total,
            "percent"       : round(done / total * 100) if total else 0,
            "ready"         : done == total,
        },
        "feedback_submitted": False,
        "timestamp"         : datetime.now().isoformat(),
    }
