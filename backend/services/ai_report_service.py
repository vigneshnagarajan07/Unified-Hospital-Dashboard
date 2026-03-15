# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# ai_report_service.py — AI Agent for Patient Reports,
#   Anomaly Detection, KPI Analysis & Metric Predictions
# ─────────────────────────────────────────────────────────────

import json
from datetime import datetime, timedelta
from typing import Optional
from core.config import GROQ_API_KEY, GROQ_MODEL, GROQ_MAX_TOKENS


# ── Vitals reference ranges ──────────────────────────────────

VITALS_RANGES = {
    "pulse_bpm":       {"low": 60,   "high": 100,  "unit": "bpm",  "label": "Heart Rate"},
    "spo2_pct":        {"low": 95,   "high": 100,  "unit": "%",    "label": "SpO₂"},
    "temperature_f":   {"low": 97.8, "high": 99.1, "unit": "°F",   "label": "Temperature"},
    "weight_kg":       {"low": None, "high": None,  "unit": "kg",   "label": "Weight"},
}

BP_RANGES = {
    "systolic":  {"low": 90,  "high": 140},
    "diastolic": {"low": 60,  "high": 90},
}


# ── Helper: Parse BP string ──────────────────────────────────

def _parse_bp(bp_str: str) -> tuple:
    """Parse '128/82' into (128, 82). Returns (None, None) on failure."""
    try:
        parts = bp_str.split("/")
        return int(parts[0]), int(parts[1])
    except Exception:
        return None, None


# ── Vitals Trend Analysis ────────────────────────────────────

def _analyse_vitals(vitals: list) -> dict:
    """
    Analyse patient vitals for anomalies and trends.
    Returns structured analysis with flags.
    """
    if not vitals:
        return {
            "status": "no_data",
            "message": "No vitals data available",
            "flags": [],
            "latest": {},
            "trend": "unknown",
        }

    latest = vitals[0]
    flags = []
    overall_status = "normal"

    # ── Check each vital parameter ──
    for param, ranges in VITALS_RANGES.items():
        value = latest.get(param)
        if value is None or ranges["low"] is None:
            continue

        if value < ranges["low"]:
            flags.append({
                "parameter": ranges["label"],
                "value": value,
                "unit": ranges["unit"],
                "status": "low",
                "severity": "warning",
                "message": f"{ranges['label']} is {value}{ranges['unit']} — below normal range ({ranges['low']}-{ranges['high']})",
            })
            overall_status = "warning"
        elif value > ranges["high"]:
            sev = "critical" if param == "pulse_bpm" and value > 120 else "warning"
            flags.append({
                "parameter": ranges["label"],
                "value": value,
                "unit": ranges["unit"],
                "status": "high",
                "severity": sev,
                "message": f"{ranges['label']} is {value}{ranges['unit']} — above normal range ({ranges['low']}-{ranges['high']})",
            })
            if sev == "critical":
                overall_status = "critical"
            elif overall_status != "critical":
                overall_status = "warning"

    # ── Blood pressure check ──
    bp_str = latest.get("blood_pressure", "")
    sys_val, dia_val = _parse_bp(bp_str)
    if sys_val is not None:
        if sys_val > 140 or dia_val > 90:
            sev = "critical" if sys_val > 160 or dia_val > 100 else "warning"
            flags.append({
                "parameter": "Blood Pressure",
                "value": bp_str,
                "unit": "mmHg",
                "status": "high",
                "severity": sev,
                "message": f"BP {bp_str} mmHg — {'severely ' if sev == 'critical' else ''}elevated (normal: <140/90)",
            })
            if sev == "critical":
                overall_status = "critical"
            elif overall_status != "critical":
                overall_status = "warning"
        elif sys_val < 90 or dia_val < 60:
            flags.append({
                "parameter": "Blood Pressure",
                "value": bp_str,
                "unit": "mmHg",
                "status": "low",
                "severity": "critical",
                "message": f"BP {bp_str} mmHg — hypotension detected (normal: >90/60)",
            })
            overall_status = "critical"

    # ── Trend (if multiple readings) ──
    trend = "stable"
    trend_details = []
    if len(vitals) >= 2:
        older = vitals[1]
        # Compare pulse
        if latest.get("pulse_bpm") and older.get("pulse_bpm"):
            diff = latest["pulse_bpm"] - older["pulse_bpm"]
            if abs(diff) > 5:
                direction = "increasing" if diff > 0 else "decreasing"
                trend_details.append(f"Pulse {direction} ({older['pulse_bpm']} → {latest['pulse_bpm']} bpm)")
                if diff > 10:
                    trend = "worsening"
                elif diff < -10:
                    trend = "improving"

        # Compare SpO2
        if latest.get("spo2_pct") and older.get("spo2_pct"):
            diff = latest["spo2_pct"] - older["spo2_pct"]
            if abs(diff) >= 1:
                direction = "improving" if diff > 0 else "declining"
                trend_details.append(f"SpO₂ {direction} ({older['spo2_pct']}% → {latest['spo2_pct']}%)")
                if diff < -2:
                    trend = "worsening"

    return {
        "status": overall_status,
        "flags": flags,
        "flag_count": len(flags),
        "latest": {
            "blood_pressure": latest.get("blood_pressure"),
            "pulse_bpm": latest.get("pulse_bpm"),
            "spo2_pct": latest.get("spo2_pct"),
            "temperature_f": latest.get("temperature_f"),
            "recorded_at": latest.get("recorded_at"),
        },
        "trend": trend,
        "trend_details": trend_details,
    }


# ── Lab Report Anomaly Detection ─────────────────────────────

def _detect_lab_anomalies(lab_reports: list) -> list:
    """
    Scan all lab reports for flagged results (high/low/abnormal).
    """
    anomalies = []
    for report in lab_reports:
        if report.get("status") != "completed":
            continue
        for result in report.get("results", []):
            flag = result.get("flag", "normal")
            if flag != "normal":
                severity = "critical" if flag in ("high", "low") and _is_critical_param(result["parameter"]) else "warning"
                anomalies.append({
                    "test_name": report["test_name"],
                    "parameter": result["parameter"],
                    "value": result["value"],
                    "unit": result.get("unit", ""),
                    "reference": result.get("reference", ""),
                    "flag": flag,
                    "severity": severity,
                    "message": f"{result['parameter']}: {result['value']} {result.get('unit', '')} (ref: {result.get('reference', 'N/A')}) — {flag}",
                })
    return anomalies


def _is_critical_param(parameter: str) -> bool:
    """Determine if a lab parameter flag should be treated as critical."""
    critical_params = [
        "Troponin", "BNP", "HbA1c", "Creatinine", "Platelet Count",
        "Dengue NS1", "Blood Glucose", "WBC Count",
    ]
    return any(cp.lower() in parameter.lower() for cp in critical_params)


# ── Risk Score Computation ───────────────────────────────────

def _compute_risk_score(patient: dict, vitals_analysis: dict, lab_anomalies: list) -> dict:
    """
    Compute patient risk score 0-100 based on:
    - Age (elderly = higher risk)
    - Critical status
    - Vitals flags
    - Lab anomalies
    - Diagnosis severity indicators
    """
    score = 20.0  # base risk

    # Age factor
    age = patient.get("age", 30)
    if age >= 70:
        score += 15
    elif age >= 60:
        score += 10
    elif age >= 50:
        score += 5
    elif age <= 5:
        score += 10  # pediatric risk

    # Critical status
    if patient.get("is_critical"):
        score += 25

    # Vitals flags
    critical_flags = sum(1 for f in vitals_analysis.get("flags", []) if f["severity"] == "critical")
    warning_flags = sum(1 for f in vitals_analysis.get("flags", []) if f["severity"] == "warning")
    score += critical_flags * 10
    score += warning_flags * 5

    # Lab anomalies
    critical_labs = sum(1 for a in lab_anomalies if a["severity"] == "critical")
    warning_labs = sum(1 for a in lab_anomalies if a["severity"] == "warning")
    score += critical_labs * 8
    score += warning_labs * 3

    # Worsening trend
    if vitals_analysis.get("trend") == "worsening":
        score += 10

    # Clamp to 0-100
    score = max(0.0, min(100.0, score))

    # Determine risk level
    if score >= 75:
        level = "critical"
        label = "High Risk"
    elif score >= 50:
        level = "elevated"
        label = "Elevated Risk"
    elif score >= 30:
        level = "moderate"
        label = "Moderate Risk"
    else:
        level = "low"
        label = "Low Risk"

    return {
        "score": round(score, 1),
        "level": level,
        "label": label,
        "factors": _build_risk_factors(patient, vitals_analysis, lab_anomalies),
    }


def _build_risk_factors(patient: dict, vitals_analysis: dict, lab_anomalies: list) -> list:
    """Build list of contributing risk factors."""
    factors = []
    if patient.get("is_critical"):
        factors.append({"factor": "Critical status", "impact": "high"})
    if patient.get("age", 30) >= 65:
        factors.append({"factor": f"Advanced age ({patient['age']} years)", "impact": "medium"})
    if vitals_analysis.get("trend") == "worsening":
        factors.append({"factor": "Worsening vital signs trend", "impact": "high"})
    for f in vitals_analysis.get("flags", []):
        factors.append({"factor": f["message"], "impact": f["severity"]})
    for a in lab_anomalies[:3]:
        factors.append({"factor": a["message"], "impact": a["severity"]})
    return factors


# ── Prediction: Recovery / Discharge ─────────────────────────

def _predict_outcomes(patient: dict, vitals_analysis: dict, risk_score: dict) -> dict:
    """
    Predict recovery trajectory and expected discharge timing.
    Rule-based predictions using patient data.
    """
    admission_str = patient.get("admission_date", "")
    discharge_str = patient.get("expected_discharge", "")

    try:
        admission_date = datetime.strptime(admission_str, "%Y-%m-%d")
        discharge_date = datetime.strptime(discharge_str, "%Y-%m-%d")
        total_stay = (discharge_date - admission_date).days
        days_so_far = (datetime.now() - admission_date).days
        days_remaining = max(0, (discharge_date - datetime.now()).days)
        progress_pct = min(100, round((days_so_far / max(total_stay, 1)) * 100))
    except Exception:
        total_stay = 5
        days_so_far = 2
        days_remaining = 3
        progress_pct = 40

    # Adjust discharge prediction based on risk
    risk_level = risk_score.get("level", "low")
    if risk_level == "critical":
        adjusted_discharge = days_remaining + 3
        confidence = "low"
        prognosis = "guarded"
    elif risk_level == "elevated":
        adjusted_discharge = days_remaining + 1
        confidence = "moderate"
        prognosis = "fair"
    else:
        adjusted_discharge = days_remaining
        confidence = "high"
        prognosis = "good"

    # Trend direction
    trend = vitals_analysis.get("trend", "stable")
    if trend == "improving":
        recovery_trajectory = "positive"
    elif trend == "worsening":
        recovery_trajectory = "declining"
    else:
        recovery_trajectory = "stable"

    return {
        "total_stay_days": total_stay,
        "days_elapsed": days_so_far,
        "days_remaining_original": days_remaining,
        "days_remaining_adjusted": adjusted_discharge,
        "progress_pct": progress_pct,
        "prognosis": prognosis,
        "recovery_trajectory": recovery_trajectory,
        "discharge_confidence": confidence,
        "predicted_discharge": (
            datetime.now() + timedelta(days=adjusted_discharge)
        ).strftime("%Y-%m-%d"),
        "similar_case_avg_stay": total_stay + 1,  # simulated benchmark
    }


# ── AI Summary Generation ────────────────────────────────────

def _generate_ai_summary(
    patient: dict,
    vitals_analysis: dict,
    lab_anomalies: list,
    risk_score: dict,
    predictions: dict,
) -> str:
    """
    Generate AI-powered clinical summary using Groq if available.
    Falls back to rule-based summary.
    """
    if GROQ_API_KEY:
        try:
            return _groq_summary(patient, vitals_analysis, lab_anomalies, risk_score, predictions)
        except Exception as e:
            print(f"[AI Report] Groq summary failed: {e}")

    return _rule_based_summary(patient, vitals_analysis, lab_anomalies, risk_score, predictions)


def _groq_summary(
    patient: dict,
    vitals_analysis: dict,
    lab_anomalies: list,
    risk_score: dict,
    predictions: dict,
) -> str:
    """Generate summary using Groq API."""
    from groq import Groq
    import httpx

    groq_client = Groq(api_key=GROQ_API_KEY, http_client=httpx.Client())

    prompt = f"""You are an AI clinical analyst for PrimeCare Hospital.
Generate a concise 4-5 sentence clinical summary for this patient:

Patient: {patient['name']}, {patient['age']}y {patient['gender']}
Diagnosis: {patient['diagnosis']}
Department: {patient.get('department_name', 'Unknown')}
Ward: {patient.get('ward', 'N/A')} | Bed: {patient.get('bed_number', 'N/A')}
Critical: {'Yes' if patient.get('is_critical') else 'No'}

Vitals Status: {vitals_analysis['status']} | Trend: {vitals_analysis['trend']}
Vitals Flags: {json.dumps(vitals_analysis.get('flags', []), default=str)}
Lab Anomalies: {json.dumps(lab_anomalies[:5], default=str)}
Risk Score: {risk_score['score']}/100 ({risk_score['label']})
Prognosis: {predictions['prognosis']}
Recovery Trajectory: {predictions['recovery_trajectory']}
Predicted Discharge: {predictions['predicted_discharge']}

Write a professional, clinical summary covering:
1. Current condition assessment
2. Key concerns from vitals/labs
3. Risk evaluation
4. Expected trajectory and recommendations

Return ONLY the text summary. No markdown, no headers."""

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()


def _rule_based_summary(
    patient: dict,
    vitals_analysis: dict,
    lab_anomalies: list,
    risk_score: dict,
    predictions: dict,
) -> str:
    """Generate rule-based fallback summary."""
    name = patient["name"]
    age = patient.get("age", "N/A")
    gender = patient.get("gender", "")
    diagnosis = patient.get("diagnosis", "Unknown")
    dept = patient.get("department_name", "Unknown")

    # Opening
    summary = f"{name} ({age}y, {gender}) is admitted to {dept} with {diagnosis}. "

    # Vitals
    v_status = vitals_analysis.get("status", "stable")
    flag_count = vitals_analysis.get("flag_count", 0)
    if v_status == "critical":
        summary += f"Vitals monitoring shows CRITICAL findings with {flag_count} parameter(s) outside normal range requiring immediate attention. "
    elif v_status == "warning":
        summary += f"Vitals show {flag_count} parameter(s) requiring monitoring. "
    else:
        summary += "Current vitals are within acceptable limits. "

    # Lab
    if lab_anomalies:
        critical_labs = [a for a in lab_anomalies if a["severity"] == "critical"]
        if critical_labs:
            params = ", ".join(a["parameter"] for a in critical_labs[:3])
            summary += f"Lab results flag critical values for {params}. "
        else:
            summary += f"{len(lab_anomalies)} lab parameter(s) show mild deviations from reference ranges. "

    # Risk & prognosis
    summary += f"Overall risk is assessed as {risk_score['label']} ({risk_score['score']}/100). "
    summary += f"Prognosis is {predictions['prognosis']} with {predictions['discharge_confidence']} confidence in the estimated discharge on {predictions['predicted_discharge']}."

    return summary


# ═════════════════════════════════════════════════════════════
# PUBLIC API
# ═════════════════════════════════════════════════════════════

def generate_patient_report(patient: dict) -> dict:
    """
    Generate a comprehensive AI report for a single patient.

    Returns
    -------
    {
        patient_id, patient_name,
        vitals_analysis, lab_anomalies,
        risk_score, predictions,
        ai_summary, generated_at,
    }
    """
    vitals_analysis = _analyse_vitals(patient.get("vitals", []))
    lab_anomalies = _detect_lab_anomalies(patient.get("lab_reports", []))
    risk_score = _compute_risk_score(patient, vitals_analysis, lab_anomalies)
    predictions = _predict_outcomes(patient, vitals_analysis, risk_score)
    ai_summary = _generate_ai_summary(
        patient, vitals_analysis, lab_anomalies, risk_score, predictions,
    )

    return {
        "patient_id": patient["patient_id"],
        "patient_name": patient["name"],
        "department": patient.get("department_name", "Unknown"),
        "diagnosis": patient.get("diagnosis", "Unknown"),
        "is_critical": patient.get("is_critical", False),
        "vitals_analysis": vitals_analysis,
        "lab_anomalies": lab_anomalies,
        "lab_anomaly_count": len(lab_anomalies),
        "risk_score": risk_score,
        "predictions": predictions,
        "ai_summary": ai_summary,
        "generated_at": datetime.now().isoformat(),
        "agent": "GKM_8 AI Report Agent v1.0",
    }


def run_ai_agent_analysis() -> dict:
    """
    Run the full AI agent pipeline:
    1. Collect hospital data
    2. Detect anomalies
    3. Compute KPIs
    4. Run predictions
    5. Generate AI summary

    Returns structured analysis dict.
    """
    from services.data_aggregator import collect_hospital_data
    from services.anomaly_detector import detect_all_kpi_anomalies
    from services.prediction_engine import run_prediction_engine
    from services import kpi_engine
    from data.repository import fetch_trend_data

    hospital_data = collect_hospital_data()
    departments = hospital_data["departments"]
    trend_data = fetch_trend_data()

    # KPIs
    kpis = kpi_engine.compute_kpis(departments, trend_data)
    aggregates = kpi_engine.compute_aggregates(departments)
    health_score = kpi_engine.compute_health_score(aggregates)

    # Anomalies
    anomalies = detect_all_kpi_anomalies(hospital_data)

    # Predictions
    predictions = run_prediction_engine(hospital_data)

    # AI Summary of the entire analysis
    ai_summary = _generate_hospital_summary(
        aggregates, anomalies, predictions, health_score,
    )

    return {
        "health_score": health_score,
        "kpi_summary": {
            "total_beds": aggregates["total_beds"],
            "occupied_beds": aggregates["occupied_beds"],
            "bed_occupancy_pct": aggregates["bed_occupancy_pct"],
            "avg_opd_wait_min": aggregates["avg_opd_wait_min"],
            "surgery_completion_rate": aggregates["surgery_completion_rate"],
            "avg_satisfaction": aggregates["avg_satisfaction"],
            "critical_patients": aggregates["critical_patients"],
        },
        "anomalies": anomalies,
        "anomaly_count": len(anomalies),
        "critical_anomalies": sum(1 for a in anomalies if a.get("severity") == "critical"),
        "predictions": predictions,
        "prediction_count": len(predictions),
        "ai_summary": ai_summary,
        "generated_at": datetime.now().isoformat(),
        "agent": "GKM_8 Hospital Intelligence Agent v2.0",
    }


def _generate_hospital_summary(
    aggregates: dict,
    anomalies: list,
    predictions: list,
    health_score: dict,
) -> str:
    """Generate a concise hospital-wide AI summary."""
    if GROQ_API_KEY:
        try:
            from groq import Groq
            import httpx

            groq_client = Groq(api_key=GROQ_API_KEY, http_client=httpx.Client())
            prompt = f"""You are an AI hospital operations analyst for PrimeCare Hospital.
Generate a concise 3-4 sentence executive summary.

Hospital Health: {health_score['score']}/100 (Grade {health_score['grade']})
Aggregates: {json.dumps(aggregates, default=str)}
Active Anomalies: {len(anomalies)} ({sum(1 for a in anomalies if a.get('severity')=='critical')} critical)
Anomaly Details: {json.dumps(anomalies[:3], default=str)}
Predictions: {len(predictions)} breach warnings

Return ONLY the summary text. No markdown."""

            response = groq_client.chat.completions.create(
                model=GROQ_MODEL, max_tokens=250,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content.strip()
        except Exception:
            pass

    # Fallback
    crit_count = sum(1 for a in anomalies if a.get("severity") == "critical")
    summary = (
        f"Hospital health score is {health_score['score']}/100 (Grade {health_score['grade']}). "
        f"Bed occupancy is at {aggregates['bed_occupancy_pct']}% with {aggregates['critical_patients']} critical patients. "
    )
    if crit_count:
        summary += f"{crit_count} critical anomalies detected requiring immediate attention. "
    if predictions:
        summary += f"{len(predictions)} KPI breach prediction(s) flagged within the next 48 hours."
    else:
        summary += "No imminent KPI breaches predicted."
    return summary
