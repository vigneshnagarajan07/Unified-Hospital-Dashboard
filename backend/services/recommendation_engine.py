# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# services/recommendation_engine.py — Ranked Action Generator
# Converts anomalies and root causes into prioritised actions
# ─────────────────────────────────────────────────────────────

from datetime import datetime


# ── Recommendation templates ──────────────────────────────────
# Keyed by (root_cause_rule_id OR kpi_name)

_RECOMMENDATIONS: dict[str, dict] = {
    # From root-cause rules
    "RC001": {
        "action"          : "Reassign doctors from low-load departments to cover OPD shortage",
        "expected_impact" : "Reduce OPD wait time by ~35% within 2 hours",
        "owner"           : "Head of Department + Hospital Administrator",
        "urgency"         : "immediate",
        "priority"        : 1,
    },
    "RC002": {
        "action"          : "Add additional lab technician shift and prioritise urgent test queue",
        "expected_impact" : "Reduce average lab TAT from >6 hrs back to 4-hr target",
        "owner"           : "Lab In-charge",
        "urgency"         : "immediate",
        "priority"        : 2,
    },
    "RC003": {
        "action"          : "Initiate discharge review for clinically stable patients; open overflow ward",
        "expected_impact" : "Free 5–10 beds within 3 hours, reduce overflow risk",
        "owner"           : "Head of Department + Floor Supervisor",
        "urgency"         : "immediate",
        "priority"        : 1,
    },
    "RC003W": {
        "action"          : "Begin proactive discharge planning for patients with >3-day LOS",
        "expected_impact" : "Maintain bed occupancy below 90% critical threshold",
        "owner"           : "Head of Department",
        "urgency"         : "today",
        "priority"        : 3,
    },
    "RC004": {
        "action"          : "Activate cross-department ICU sharing; review 2 patients for step-down to HDU",
        "expected_impact" : "Create ICU buffer within 1 hour to handle incoming critical cases",
        "owner"           : "Head of Emergency + On-call Intensivist",
        "urgency"         : "immediate",
        "priority"        : 1,
    },
    "RC005": {
        "action"          : "Extend OT hours; schedule evening surgical slots for pending cases",
        "expected_impact" : "Clear surgical backlog same-day, improve completion rate to >90%",
        "owner"           : "Head of Surgery + OT Coordinator",
        "urgency"         : "today",
        "priority"        : 2,
    },
    "RC006": {
        "action"          : "Request float nurse pool coverage; reassign from lower-occupancy wards",
        "expected_impact" : "Restore nurse-to-bed ratio to minimum 0.20 within 1 shift",
        "owner"           : "Nursing Supervisor",
        "urgency"         : "today",
        "priority"        : 2,
    },
    # From KPI anomalies
    "bed_occupancy": {
        "action"          : "Activate overflow capacity plan and accelerate discharge approvals",
        "expected_impact" : "Prevent full-ward lockout and maintain safe admission pipeline",
        "owner"           : "Hospital Administrator",
        "urgency"         : "immediate",
        "priority"        : 1,
    },
    "opd_wait_time": {
        "action"          : "Deploy extra triage nurse; activate second OPD consultation room",
        "expected_impact" : "Cut OPD wait time by 25–30% within 1 hour",
        "owner"           : "Head of OPD",
        "urgency"         : "immediate",
        "priority"        : 1,
    },
    "lab_tat": {
        "action"          : "Schedule an additional lab technician shift and prioritise STAT orders",
        "expected_impact" : "Restore lab TAT to ≤4-hour baseline by next shift",
        "owner"           : "Lab Manager",
        "urgency"         : "today",
        "priority"        : 2,
    },
    "billing_collection_rate": {
        "action"          : "Trigger insurance follow-up for all pending claims >7 days; review denials",
        "expected_impact" : "Recover 8–12% of outstanding revenue within 5 business days",
        "owner"           : "Revenue Manager",
        "urgency"         : "this_week",
        "priority"        : 3,
    },
    "nps": {
        "action"          : "Conduct immediate patient feedback review; escalate top 3 complaint categories",
        "expected_impact" : "Improve NPS by 5–10 points within 2 weeks",
        "owner"           : "Patient Experience Lead",
        "urgency"         : "this_week",
        "priority"        : 3,
    },
}

_URGENCY_ORDER = {"immediate": 0, "today": 1, "this_week": 2}


def _build_recommendation(
    rec_id:      str,
    source_key:  str,
    department:  str,
    department_id: str,
    extra_context: str = "",
) -> dict:
    """Compose a single recommendation dict from the template."""
    template = _RECOMMENDATIONS.get(source_key, {
        "action"         : "Review operational data and escalate to department head.",
        "expected_impact": "Stabilise current KPI trajectory.",
        "owner"          : "Hospital Administrator",
        "urgency"        : "today",
        "priority"       : 3,
    })
    return {
        "rec_id"          : rec_id,
        "source_key"      : source_key,
        "department"      : department,
        "department_id"   : department_id,
        "action"          : template["action"],
        "expected_impact" : template["expected_impact"],
        "owner"           : template["owner"],
        "urgency"         : template["urgency"],
        "priority"        : template["priority"],
        "context"         : extra_context,
        "status"          : "pending",
        "generated_at"    : datetime.now().isoformat(),
    }


def generate_recommendations(
    anomalies:    list[dict],
    root_causes:  list[dict],
) -> list[dict]:
    """
    Generate a ranked, deduplicated list of actionable recommendations.

    Parameters
    ----------
    anomalies   : output from detect_all_kpi_anomalies()
    root_causes : output from analyze_root_causes()

    Returns
    -------
    List sorted by urgency then priority (most critical first).
    """
    recommendations: list[dict] = []
    seen_keys: set[str]         = set()

    def _rec_id() -> str:
        return "REC{:03d}".format(len(recommendations) + 1)

    # ── From root causes (higher specificity) ─────────────────
    for rc in root_causes:
        rule_id: str = str(rc.get("rule_id", ""))
        dept_id: str = str(rc.get("department_id", ""))
        dept:    str = str(rc.get("department_name", "Hospital-wide"))
        dedup_key: str = "{}_{}".format(rule_id, dept_id)

        if dedup_key not in seen_keys and rule_id in _RECOMMENDATIONS:
            seen_keys.add(dedup_key)
            rec = _build_recommendation(
                rec_id        = _rec_id(),
                source_key    = rule_id,
                department    = dept,
                department_id = dept_id,
                extra_context = str(rc.get("explanation", "")),
            )
            recommendations.append(rec)

    # ── From KPI anomalies (fallback for KPIs not covered by rules)
    for anom in anomalies:
        kpi:     str = str(anom.get("kpi_name", ""))
        dept_id  = str(anom.get("department_id", ""))
        dept     = str(anom.get("department_name", anom.get("department_id", "Hospital-wide")))
        dedup_key = "{}_{}".format(kpi, dept_id)

        if dedup_key not in seen_keys and kpi in _RECOMMENDATIONS:
            seen_keys.add(dedup_key)
            rec = _build_recommendation(
                rec_id        = _rec_id(),
                source_key    = kpi,
                department    = dept,
                department_id = dept_id,
                extra_context = str(anom.get("insight", "")),
            )
            recommendations.append(rec)

    # Sort by urgency then priority
    recommendations.sort(
        key=lambda r: (_URGENCY_ORDER.get(str(r["urgency"]), 9), int(r["priority"]))
    )
    return recommendations

