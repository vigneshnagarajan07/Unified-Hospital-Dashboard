# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# ai_service.py — AI insights using Groq (free tier)
# Falls back to simulated insights if no API key
# ─────────────────────────────────────────────────────────────

import os
import json
from core.config import GROQ_API_KEY, GROQ_MODEL, GROQ_MAX_TOKENS


# ── Simulated insights (fallback if no Groq key) ─────────────

SIMULATED_INSIGHTS = [
    {
        "insight_id"         : "INS001",
        "title"              : "General Medicine overflow risk within 6 hours",
        "insight"            : "General Medicine is at 97% bed occupancy with 116 of 120 beds occupied. At current admission rate, the ward will reach 100% capacity by evening. Immediate discharge review required.",
        "department"         : "General Medicine",
        "priority"           : "critical",
        "category"           : "operational",
        "recommended_action" : "Initiate discharge protocol for clinically stable patients. Contact floor supervisor to prepare 5 additional beds in overflow wing.",
        "impact_score"       : 9,
    },
    {
        "insight_id"         : "INS002",
        "title"              : "Cardiology OPD bottleneck causing patient dissatisfaction",
        "insight"            : "Cardiology OPD wait time is 47 minutes — 38% above the 34-minute baseline. Patient satisfaction in Cardiology has dropped to 3.9/5, the lowest among all departments.",
        "department"         : "Cardiology",
        "priority"           : "critical",
        "category"           : "clinical",
        "recommended_action" : "Deploy one additional triage nurse to Cardiology OPD immediately. Consider opening a second consultation room for the afternoon session.",
        "impact_score"       : 8,
    },
    {
        "insight_id"         : "INS003",
        "title"              : "Emergency ICU at 100% — no buffer for incoming cases",
        "insight"            : "Emergency ICU has all 6 beds occupied with 12 critical patients on the floor. Any new critical case will require ICU bed from another department.",
        "department"         : "Emergency",
        "priority"           : "critical",
        "category"           : "clinical",
        "recommended_action" : "Activate cross-department ICU sharing protocol. Review 2 ICU patients for step-down to HDU. Alert on-call intensivist.",
        "impact_score"       : 9,
    },
    {
        "insight_id"         : "INS004",
        "title"              : "Surgery completion rate below target — 3 cases pending",
        "insight"            : "Only 14 of 17 scheduled surgeries completed today (82.4%). Three cases are pending — if not completed today, they will extend wait times and increase patient anxiety.",
        "department"         : "Orthopedics",
        "priority"           : "warning",
        "category"           : "operational",
        "recommended_action" : "Check OT availability for evening slots. Prioritise the 2 Orthopedics pending cases. Notify surgeons and anaesthesia team.",
        "impact_score"       : 6,
    },
    {
        "insight_id"         : "INS005",
        "title"              : "Pediatrics best practice — replicate hospital-wide",
        "insight"            : "Pediatrics has the highest patient satisfaction (4.6/5), lowest OPD wait (15 min, 17% below baseline), and 100% surgery completion. Their workflow model is a benchmark.",
        "department"         : "Pediatrics",
        "priority"           : "info",
        "category"           : "operational",
        "recommended_action" : "Schedule a cross-department meeting to share Pediatrics SOPs with Cardiology and General Medicine. Focus on triage process and patient communication.",
        "impact_score"       : 5,
    },
]


SIMULATED_RECOMMENDATIONS = [
    {
        "rec_id"       : "REC001",
        "title"        : "Deploy extra nurse to Cardiology OPD",
        "description"  : "OPD wait time is 38% above baseline. An additional triage nurse will reduce the queue immediately.",
        "department"   : "Cardiology",
        "urgency"      : "immediate",
        "owner"        : "Head of Cardiology",
        "impact_score" : 8,
        "status"       : "pending",
    },
    {
        "rec_id"       : "REC002",
        "title"        : "Initiate discharge review in General Medicine",
        "description"  : "97% bed occupancy. Review all patients for discharge eligibility to free at least 5 beds before evening admission peak.",
        "department"   : "General Medicine",
        "urgency"      : "immediate",
        "owner"        : "Head of General Medicine",
        "impact_score" : 9,
        "status"       : "pending",
    },
    {
        "rec_id"       : "REC003",
        "title"        : "Activate ICU overflow protocol in Emergency",
        "description"  : "Emergency ICU fully occupied. Activate overflow protocol and review 2 patients for step-down.",
        "department"   : "Emergency",
        "urgency"      : "immediate",
        "owner"        : "Head of Emergency",
        "impact_score" : 9,
        "status"       : "pending",
    },
    {
        "rec_id"       : "REC004",
        "title"        : "Extend OT hours for pending surgeries",
        "description"  : "3 surgeries pending. Schedule evening OT slots to avoid carrying over to tomorrow.",
        "department"   : "Orthopedics",
        "urgency"      : "today",
        "owner"        : "Head of Orthopedics",
        "impact_score" : 6,
        "status"       : "pending",
    },
    {
        "rec_id"       : "REC005",
        "title"        : "Share Pediatrics workflow with other departments",
        "description"  : "Pediatrics has top satisfaction and lowest wait. Schedule SOP sharing session this week.",
        "department"   : "Pediatrics",
        "urgency"      : "this_week",
        "owner"        : "Hospital Administrator",
        "impact_score" : 5,
        "status"       : "pending",
    },
]


def generate_insights(departments: list, anomalies: list) -> list:
    """
    Try Groq API first — fall back to simulated insights
    """
    if not GROQ_API_KEY:
        return SIMULATED_INSIGHTS

    try:
        from groq import Groq

        groq_client = Groq(api_key=GROQ_API_KEY)

        # Build context for Groq
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

        anomaly_summary = [
            { "dept": a["department_name"], "issue": a["message"], "severity": a["severity"] }
            for a in anomalies[:5]
        ]

        prompt = f"""
You are an AI hospital operations analyst for PrimeCare Hospital Chennai.
Analyse this real-time data and return EXACTLY 5 insights as a JSON array.

Department data:
{json.dumps(dept_summary, indent=2)}

Active anomalies:
{json.dumps(anomaly_summary, indent=2)}

Return ONLY a JSON array with exactly 5 objects. Each object must have:
- insight_id (string: INS001 to INS005)
- title (short, specific)
- insight (2-3 sentences, specific to the data)
- department (department name)
- priority (critical / warning / info)
- category (operational / clinical / financial / staffing)
- recommended_action (specific, actionable)
- impact_score (1-10 integer)

Return ONLY the JSON array. No preamble. No markdown.
"""

        groq_response = groq_client.chat.completions.create(
            model      = GROQ_MODEL,
            max_tokens = GROQ_MAX_TOKENS,
            messages   = [{"role": "user", "content": prompt}],
        )

        raw_text       = groq_response.choices[0].message.content.strip()
        parsed_insights = json.loads(raw_text)
        return parsed_insights

    except Exception as groq_error:
        print(f"Groq API error: {groq_error} — using simulated insights")
        return SIMULATED_INSIGHTS


def generate_recommendations(anomalies: list) -> list:
    """
    Returns recommendations — simulated for now
    Can be replaced with Groq-powered recommendations
    """
    return SIMULATED_RECOMMENDATIONS