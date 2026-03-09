# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# services/recommendation_engine.py — Ranked Action Generator
# FIX: Added title, description, impact_score fields so frontend
#      RecommendationCard renders correctly (previously blank)
# ─────────────────────────────────────────────────────────────

from datetime import datetime


_RECOMMENDATIONS: dict[str, dict] = {
    "RC001": {
        "title"           : "Reassign doctors to cover OPD shortage",
        "description"     : "Reassign doctors from low-load departments to cover OPD shortage.",
        "action"          : "Reassign doctors from low-load departments to cover OPD shortage",
        "expected_impact" : "Reduce OPD wait time by ~35% within 2 hours",
        "owner"           : "Head of Department + Hospital Administrator",
        "urgency"         : "immediate",
        "priority"        : 1,
        "impact_score"    : 8,
    },
    "RC002": {
        "title"           : "Add lab technician shift for TAT",
        "description"     : "Add additional lab technician shift and prioritise urgent test queue.",
        "action"          : "Add additional lab technician shift and prioritise urgent test queue",
        "expected_impact" : "Reduce average lab TAT from >6 hrs back to 4-hr target",
        "owner"           : "Lab In-charge",
        "urgency"         : "immediate",
        "priority"        : 2,
        "impact_score"    : 7,
    },
    "RC003": {
        "title"           : "Initiate discharge review & open overflow ward",
        "description"     : "Initiate discharge review for stable patients and open overflow ward.",
        "action"          : "Initiate discharge review for clinically stable patients; open overflow ward",
        "expected_impact" : "Free 5–10 beds within 3 hours, reduce overflow risk",
        "owner"           : "Head of Department + Floor Supervisor",
        "urgency"         : "immediate",
        "priority"        : 1,
        "impact_score"    : 9,
    },
    "RC003W": {
        "title"           : "Proactive discharge planning",
        "description"     : "Begin proactive discharge planning for patients with >3-day LOS.",
        "action"          : "Begin proactive discharge planning for patients with >3-day LOS",
        "expected_impact" : "Maintain bed occupancy below 90% critical threshold",
        "owner"           : "Head of Department",
        "urgency"         : "today",
        "priority"        : 3,
        "impact_score"    : 6,
    },
    "RC004": {
        "title"           : "Activate ICU overflow protocol",
        "description"     : "Activate cross-department ICU sharing and review 2 patients for step-down to HDU.",
        "action"          : "Activate cross-department ICU sharing; review 2 patients for step-down to HDU",
        "expected_impact" : "Create ICU buffer within 1 hour to handle incoming critical cases",
        "owner"           : "Head of Emergency + On-call Intensivist",
        "urgency"         : "immediate",
        "priority"        : 1,
        "impact_score"    : 9,
    },
    "RC005": {
        "title"           : "Extend OT hours for pending surgeries",
        "description"     : "Extend OT hours and schedule evening surgical slots for pending cases.",
        "action"          : "Extend OT hours; schedule evening surgical slots for pending cases",
        "expected_impact" : "Clear surgical backlog same-day, improve completion rate to >90%",
        "owner"           : "Head of Surgery + OT Coordinator",
        "urgency"         : "today",
        "priority"        : 2,
        "impact_score"    : 6,
    },
    "RC006": {
        "title"           : "Request float nurse pool coverage",
        "description"     : "Request float nurse pool and reassign from lower-occupancy wards.",
        "action"          : "Request float nurse pool coverage; reassign from lower-occupancy wards",
        "expected_impact" : "Restore nurse-to-bed ratio to minimum 0.20 within 1 shift",
        "owner"           : "Nursing Supervisor",
        "urgency"         : "today",
        "priority"        : 2,
        "impact_score"    : 7,
    },
    "bed_occupancy": {
        "title"           : "Activate overflow capacity plan",
        "description"     : "Activate overflow capacity plan and accelerate discharge approvals.",
        "action"          : "Activate overflow capacity plan and accelerate discharge approvals",
        "expected_impact" : "Prevent full-ward lockout and maintain safe admission pipeline",
        "owner"           : "Hospital Administrator",
        "urgency"         : "immediate",
        "priority"        : 1,
        "impact_score"    : 9,
    },
    "opd_wait_time": {
        "title"           : "Deploy extra triage nurse to OPD",
        "description"     : "Deploy extra triage nurse and activate second OPD consultation room.",
        "action"          : "Deploy extra triage nurse; activate second OPD consultation room",
        "expected_impact" : "Cut OPD wait time by 25–30% within 1 hour",
        "owner"           : "Head of OPD",
        "urgency"         : "immediate",
        "priority"        : 1,
        "impact_score"    : 8,
    },
    "lab_tat": {
        "title"           : "Schedule additional lab technician shift",
        "description"     : "Schedule an additional lab technician shift and prioritise STAT orders.",
        "action"          : "Schedule an additional lab technician shift and prioritise STAT orders",
        "expected_impact" : "Restore lab TAT to ≤4-hour baseline by next shift",
        "owner"           : "Lab Manager",
        "urgency"         : "today",
        "priority"        : 2,
        "impact_score"    : 6,
    },
    "billing_collection_rate": {
        "title"           : "Follow up on pending insurance claims",
        "description"     : "Trigger insurance follow-up for all pending claims >7 days and review denials.",
        "action"          : "Trigger insurance follow-up for all pending claims >7 days; review denials",
        "expected_impact" : "Recover 8–12% of outstanding revenue within 5 business days",
        "owner"           : "Revenue Manager",
        "urgency"         : "this_week",
        "priority"        : 3,
        "impact_score"    : 5,
    },
    "nps": {
        "title"           : "Conduct patient feedback review",
        "description"     : "Conduct immediate patient feedback review and escalate top 3 complaint categories.",
        "action"          : "Conduct immediate patient feedback review; escalate top 3 complaint categories",
        "expected_impact" : "Improve NPS by 5–10 points within 2 weeks",
        "owner"           : "Patient Experience Lead",
        "urgency"         : "this_week",
        "priority"        : 3,
        "impact_score"    : 5,
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
    template = _RECOMMENDATIONS.get(source_key, {
        "title"          : "Review operational data",
        "description"    : "Review operational data and escalate to department head.",
        "action"         : "Review operational data and escalate to department head.",
        "expected_impact": "Stabilise current KPI trajectory.",
        "owner"          : "Hospital Administrator",
        "urgency"        : "today",
        "priority"       : 3,
        "impact_score"   : 4,
    })
    return {
        "rec_id"          : rec_id,
        "title"           : template["title"],
        "description"     : template["description"],
        "source_key"      : source_key,
        "department"      : department,
        "department_id"   : department_id,
        "action"          : template["action"],
        "expected_impact" : template["expected_impact"],
        "owner"           : template["owner"],
        "urgency"         : template["urgency"],
        "priority"        : template["priority"],
        "impact_score"    : template["impact_score"],
        "context"         : extra_context,
        "status"          : "pending",
        "generated_at"    : datetime.now().isoformat(),
    }


def generate_recommendations(
    anomalies:    list[dict],
    root_causes:  list[dict],
) -> list[dict]:
    recommendations: list[dict] = []
    seen_keys: set[str]         = set()

    def _rec_id() -> str:
        return "REC{:03d}".format(len(recommendations) + 1)

    # From root causes
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

    # From KPI anomalies
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

    recommendations.sort(
        key=lambda r: (_URGENCY_ORDER.get(str(r["urgency"]), 9), int(r["priority"]))
    )
    return recommendations
