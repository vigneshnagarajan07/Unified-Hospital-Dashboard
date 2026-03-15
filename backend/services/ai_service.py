# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# ai_service.py — AI insights via Groq REST API
#
# FIX: Replaced groq SDK (httpx version conflict) with direct
#      httpx POST to Groq's chat completions REST endpoint.
#      This bypasses all SDK version issues completely.
#
# Falls back to simulated insights if no API key is set.
# ─────────────────────────────────────────────────────────────

import os
import json
import httpx
from core.config import GROQ_API_KEY, GROQ_MODEL, GROQ_MAX_TOKENS

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


# ── Direct Groq REST call — no SDK dependency ─────────────────

def _call_groq(messages: list, max_tokens: int = None) -> str:
    """
    POST directly to Groq's chat completions endpoint.
    Returns the assistant's message content as a string.
    Raises on failure so callers can fall back to simulated data.
    """
    if not GROQ_API_KEY:
        raise ValueError("No GROQ_API_KEY configured")

    payload = {
        "model":      GROQ_MODEL,
        "max_tokens": max_tokens or GROQ_MAX_TOKENS,
        "messages":   messages,
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }

    with httpx.Client(timeout=20.0) as client:
        response = client.post(GROQ_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()


# ── Simulated insights fallback ───────────────────────────────

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


# ── Public API ────────────────────────────────────────────────

def generate_insights(departments: list, anomalies: list) -> list:
    """Try Groq first — fall back to simulated insights."""
    if not GROQ_API_KEY:
        return SIMULATED_INSIGHTS

    try:
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
            {"dept": a["department_name"], "issue": a["message"], "severity": a["severity"]}
            for a in anomalies[:5]
        ]

        prompt = f"""You are an AI hospital operations analyst for PrimeCare Hospital Chennai.
Analyse this real-time data and return EXACTLY 5 insights as a JSON array.

Department data:
{json.dumps(dept_summary, indent=2)}

Active anomalies:
{json.dumps(anomaly_summary, indent=2)}

Return ONLY a JSON array with exactly 5 objects. Each must have:
- insight_id (string: INS001 to INS005)
- title (short, specific)
- insight (2-3 sentences, data-specific)
- department (department name)
- priority (critical / warning / info)
- category (operational / clinical / financial / staffing)
- recommended_action (specific, actionable)
- impact_score (1-10 integer)

Return ONLY the JSON array. No preamble, no markdown, no backticks."""

        raw = _call_groq([{"role": "user", "content": prompt}])
        clean = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)

    except Exception as err:
        print(f"[AI] Groq insights error: {err} — using simulated insights")
        return SIMULATED_INSIGHTS


def generate_recommendations(anomalies: list) -> list:
    """Returns recommendations — simulated for now."""
    return SIMULATED_RECOMMENDATIONS


def answer_patient_question(patient: dict, question: str) -> dict:
    """
    Answers a patient's health question using their medical context.
    Uses Groq via direct REST if available, falls back to friendly message.
    """
    if not GROQ_API_KEY:
        return {
            "answer": "The AI assistant is currently unavailable. Please speak to your nurse or doctor for any health questions.",
            "source": "fallback",
        }

    diagnosis    = patient.get("diagnosis", "")
    patient_name = patient.get("name", "Patient")
    latest_vital = patient["vitals"][0] if patient.get("vitals") else {}

    medications = []
    if patient.get("prescriptions"):
        for med in patient["prescriptions"][0].get("medications", []):
            medications.append(f"{med['name']} {med['dose']}")

    system_prompt = (
        "You are a compassionate hospital AI health assistant for PrimeCare Hospital Chennai. "
        "Answer in simple, friendly language. Keep answers to 3-4 sentences. "
        "If the question needs a doctor's evaluation, say so. "
        "Never diagnose or prescribe. Respond with ONLY the answer — no preamble, no JSON."
    )

    user_prompt = (
        f"Patient: {patient_name}, admitted with: {diagnosis}\n"
        f"Current medications: {', '.join(medications) or 'None'}\n"
        f"Latest vitals: BP={latest_vital.get('blood_pressure','N/A')}, "
        f"Pulse={latest_vital.get('pulse_bpm','N/A')}bpm, "
        f"SpO2={latest_vital.get('spo2_pct','N/A')}%, "
        f"Temp={latest_vital.get('temperature_f','N/A')}F\n\n"
        f"Patient asks: \"{question}\""
    )

    try:
        answer = _call_groq(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=300,
        )
        return {"answer": answer, "source": "groq"}

    except Exception as err:
        print(f"[AI] Patient Q&A error: {err}")
        return {
            "answer": "I'm unable to answer right now. Please speak to your nurse or doctor for assistance.",
            "source": "fallback",
        }


def ask_dashboard(question: str, hospital_context: dict = None) -> dict:
    """
    'Ask the Dashboard' chatbox — answers hospital-wide operational questions.
    This powers the admin chatbox that was failing before.
    """
    if not GROQ_API_KEY:
        return {
            "answer": (
                "The AI chatbox requires a GROQ_API_KEY to function. "
                "Add it to your backend/.env file and restart the server."
            ),
            "source": "fallback",
        }

    context_str = ""
    if hospital_context:
        context_str = f"\nHospital context:\n{json.dumps(hospital_context, indent=2)[:2000]}"

    system_prompt = (
        "You are an intelligent hospital operations AI assistant for PrimeCare Hospital, Chennai. "
        "You have access to real-time hospital data including bed occupancy, OPD wait times, "
        "staff on duty, anomalies, and financial metrics. "
        "Answer questions clearly and concisely. Use specific numbers when available. "
        "Keep responses under 5 sentences unless a detailed breakdown is asked for."
    )

    user_prompt = f"Question: {question}{context_str}"

    try:
        answer = _call_groq(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=400,
        )
        return {"answer": answer, "source": "groq"}

    except Exception as err:
        print(f"[AI] Dashboard chat error: {err}")
        return {
            "answer": "I'm having trouble connecting to the AI service right now. Try again in a moment.",
            "source": "fallback",
        }