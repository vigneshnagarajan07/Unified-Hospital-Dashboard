# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# services/insight_engine.py — Natural Language Insight Generator
# Rule-based with optional LLM (Groq) integration
# ─────────────────────────────────────────────────────────────

import json
from datetime import datetime
from core.config import GROQ_API_KEY, GROQ_MODEL, GROQ_MAX_TOKENS


# ────────────────────────────────────────────────────────────
# 1. Rule-based insight generator (always available, no API)
# ────────────────────────────────────────────────────────────

def _rule_based_insight(root_cause: dict) -> str:
    """
    Convert a root cause dict into a detailed narrative sentence.
    """
    dept   = root_cause.get("department_name", "Hospital-wide")
    cause  = root_cause.get("root_cause", "Unknown")
    expl   = root_cause.get("explanation", "")
    sev    = root_cause.get("severity", "warning")

    prefix = "⚠️ CRITICAL: " if sev == "critical" else "⚠️ "
    return f"{prefix}{dept} — {cause}. {expl}"


def _generate_rule_based_insights(
    hospital_data: dict,
    anomalies: list[dict],
    root_causes: list[dict],
) -> list[dict]:
    """
    Produce a structured insight list purely from rule-based logic.
    Combines anomaly signals and root causes into rich insight objects.
    """
    departments = hospital_data.get("departments", [])
    insights    = []
    ins_count   = 1

    # ── Per-department anomaly insights ───────────────────────
    for dept in departments:
        dept_id   = dept["id"]
        dept_name = dept["name"]
        dept_anoms= [a for a in anomalies if a.get("department_id") == dept_id]

        for anom in dept_anoms:
            kpi      = anom["kpi_name"].replace("_", " ").title()
            dev_pct  = abs(anom["deviation_pct"])
            message  = anom.get("insight", "")
            rec      = anom.get("recommendation", "")
            sev      = anom.get("severity", "warning")

            insights.append({
                "insight_id"         : f"INS{ins_count:03d}",
                "title"              : f"{dept_name}: {kpi} anomaly detected ({'+' if anom['deviation'] > 0 else ''}{dev_pct:.1f}%)",
                "insight"            : message,
                "department"         : dept_name,
                "priority"           : sev,
                "category"           : _categorise_kpi(anom["kpi_name"]),
                "recommended_action" : rec,
                "impact_score"       : 9 if sev == "critical" else 6,
                "source"             : "rule_engine",
            })
            ins_count += 1

    # ── Root-cause narrative insights ─────────────────────────
    for rc in root_causes[:3]:   # top 3 root causes
        insights.append({
            "insight_id"         : f"INS{ins_count:03d}",
            "title"              : f"Root Cause: {rc['root_cause']} in {rc['department_name']}",
            "insight"            : rc.get("explanation", ""),
            "department"         : rc.get("department_name", "Hospital-wide"),
            "priority"           : rc.get("severity", "warning"),
            "category"           : "operational",
            "recommended_action" : _root_cause_rec(rc["rule_id"]),
            "impact_score"       : 8 if rc.get("severity") == "critical" else 5,
            "source"             : "root_cause_engine",
        })
        ins_count += 1

    # ── Positive insight (best department) ────────────────────
    best = max(departments, key=lambda d: d.get("patient_satisfaction", 0), default=None)
    if best:
        insights.append({
            "insight_id"         : f"INS{ins_count:03d}",
            "title"              : f"{best['name']} — Best Practice Benchmark",
            "insight"            : (
                f"{best['name']} leads with {best['patient_satisfaction']}/5 satisfaction, "
                f"{best['opd_wait_time_min']} min OPD wait, and "
                f"{round(best['occupied_beds']/best['total_beds']*100, 1)}% bed occupancy. "
                f"Their workflow practices are worth replicating hospital-wide."
            ),
            "department"         : best["name"],
            "priority"           : "info",
            "category"           : "operational",
            "recommended_action" : f"Share {best['name']} workflow SOPs with underperforming departments.",
            "impact_score"       : 4,
            "source"             : "rule_engine",
        })

    return insights[:10]   # cap at 10 insights


def _categorise_kpi(kpi_name: str) -> str:
    return {
        "bed_occupancy"          : "operational",
        "opd_wait_time"          : "clinical",
        "lab_tat"                : "clinical",
        "billing_collection_rate": "financial",
        "nps"                    : "patient_experience",
    }.get(kpi_name, "operational")


def _root_cause_rec(rule_id: str) -> str:
    recs = {
        "RC001" : "Reassign doctors from less-busy departments. Activate overflow OPD consultation.",
        "RC002" : "Schedule additional lab technician shift. Prioritise urgent test processing.",
        "RC003" : "Initiate discharge process for clinically stable patients. Activate overflow ward.",
        "RC003W": "Begin discharge planning for eligible patients before reaching critical threshold.",
        "RC004" : "Activate cross-department ICU sharing protocol. Review 2 patients for step-down to HDU.",
        "RC005" : "Extend OT hours. Schedule evening surgical slots for pending cases.",
        "RC006" : "Request float nurse pool coverage. Reassign from lower-occupancy wards.",
    }
    return recs.get(rule_id, "Escalate to department head for immediate review.")


# ────────────────────────────────────────────────────────────
# 2. LLM-powered insight generator (Groq, optional)
# ────────────────────────────────────────────────────────────

def _llm_insights(hospital_data: dict, anomalies: list[dict]) -> list[dict] | None:
    """
    Try to generate insights using Groq LLM.
    Returns None if not available or on any error.
    """
    if not GROQ_API_KEY:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)

        departments  = hospital_data.get("departments", [])
        dept_summary = [
            {
                "name"         : d["name"],
                "bed_occupancy": round((d["occupied_beds"] / d["total_beds"]) * 100, 1),
                "opd_wait"     : d["opd_wait_time_min"],
                "satisfaction" : d["patient_satisfaction"],
                "critical_pts" : d["critical_patients"],
            }
            for d in departments
        ]
        anom_summary = [
            {"dept": a.get("department_name"), "kpi": a["kpi_name"],
             "deviation_pct": a["deviation_pct"], "severity": a["severity"]}
            for a in anomalies[:5]
        ]

        prompt = f"""
You are a hospital operations analyst for PrimeCare Hospital Chennai.
Analyse this real-time hospital data and return EXACTLY 5 clinical/operational insights as a JSON array.

Department metrics:
{json.dumps(dept_summary, indent=2)}

Active anomalies:
{json.dumps(anom_summary, indent=2)}

Return ONLY a JSON array. Each object must have:
- insight_id (INS001 to INS005)
- title (short, department-specific)
- insight (2–3 sentences, data-driven)
- department (department name)
- priority (critical / warning / info)
- category (operational / clinical / financial / patient_experience)
- recommended_action (specific and actionable)
- impact_score (integer 1–10)

Return ONLY the JSON array. No markdown, no preamble.
"""
        response = client.chat.completions.create(
            model     = GROQ_MODEL,
            max_tokens= GROQ_MAX_TOKENS,
            messages  = [{"role": "user", "content": prompt}],
        )
        raw = response.choices[0].message.content.strip()
        parsed = json.loads(raw)
        for ins in parsed:
            ins["source"] = "groq_llm"
        return parsed

    except Exception as e:
        print(f"[InsightEngine] Groq error: {e} — falling back to rule-based")
        return None


# ────────────────────────────────────────────────────────────
# 3. Public API
# ────────────────────────────────────────────────────────────

def generate_insights(
    hospital_data: dict,
    anomalies: list[dict],
    root_causes: list[dict],
) -> list[dict]:
    """
    Generate natural language insights for the dashboard.

    Tries LLM first; falls back to rule-based engine automatically.

    Parameters
    ----------
    hospital_data : output from collect_hospital_data()
    anomalies     : output from detect_all_kpi_anomalies()
    root_causes   : output from analyze_root_causes()

    Returns
    -------
    List of insight dicts ready for the API response.
    """
    llm_result = _llm_insights(hospital_data, anomalies)
    if llm_result:
        return llm_result

    return _generate_rule_based_insights(hospital_data, anomalies, root_causes)
