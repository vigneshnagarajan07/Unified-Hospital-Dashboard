from fastapi import APIRouter
from data.hospital_data import get_hospital_data

router = APIRouter(prefix="/api/m2", tags=["KPI Engine"])

@router.get("/kpis")
async def get_kpis():
    """
    M2 - KPI Engine
    Computes overall hospital KPIs and their status (critical, warning, good).
    """
    data = get_hospital_data()
    depts = data["departments"]
    
    # Compute Aggregates
    total_beds = sum(d["beds"]["total"] for d in depts)
    occupied_beds = sum(d["beds"]["occupied"] for d in depts)
    occupancy_percent = round((occupied_beds / total_beds * 100), 1) if total_beds else 0
    
    total_surgeries_scheduled = sum(d["surgeries"]["scheduled"] for d in depts)
    total_surgeries_completed = sum(d["surgeries"]["completed"] for d in depts)
    surgery_completion_rate = round((total_surgeries_completed / total_surgeries_scheduled * 100), 1) if total_surgeries_scheduled else 100
    
    avg_wait = round(sum(d["opd"]["wait_time"] for d in depts) / len(depts), 1)
    
    avg_satisfaction = round(sum(d["satisfaction"] for d in depts) / len(depts), 2)
    
    total_critical = sum(d["critical_patients"] for d in depts)
    total_patients = sum(d["opd"]["patients_today"] for d in depts) + occupied_beds
    critical_ratio = round((total_critical / total_patients * 100), 1) if total_patients else 0
    
    total_docs = sum(d["staff"]["doctors"] for d in depts)
    total_nurses = sum(d["staff"]["nurses"] for d in depts)
    staff_utilization = 85.0 # Mocked overall utilization
    
    # helper for status logic
    def get_occupancy_status(val):
        if val > 90: return "critical"
        if val > 80: return "warning"
        return "good"
        
    def get_wait_status(val):
        if val > 35: return "critical"
        if val > 25: return "warning"
        return "good"

    # Construct KPIs array
    kpis = [
        {
            "id": "bed_occupancy",
            "name": "Bed Occupancy",
            "value": occupancy_percent,
            "unit": "%",
            "baseline": 80.0,
            "delta": round(occupancy_percent - 80.0, 1),
            "trend_direction": "up",
            "status": get_occupancy_status(occupancy_percent),
            "sparkline": data["trends"]["bed_occupancy_percent"]
        },
        {
            "id": "surgery_completion",
            "name": "Surgery Completion",
            "value": surgery_completion_rate,
            "unit": "%",
            "baseline": 90.0,
            "delta": round(surgery_completion_rate - 90.0, 1),
            "trend_direction": "down",
            "status": "warning" if surgery_completion_rate < 90 else "good",
            "sparkline": [95, 92, 88, 91, 89, 85, surgery_completion_rate]
        },
        {
            "id": "avg_opd_wait",
            "name": "Avg OPD Wait",
            "value": avg_wait,
            "unit": "min",
            "baseline": 25.0,
            "delta": round(avg_wait - 25.0, 1),
            "trend_direction": "up",
            "status": get_wait_status(avg_wait),
            "sparkline": data["trends"]["opd_wait_min"]
        },
        {
            "id": "patient_satisfaction",
            "name": "Patient Satisfaction",
            "value": avg_satisfaction,
            "unit": "/ 5",
            "baseline": 4.2,
            "delta": round(avg_satisfaction - 4.2, 2),
            "trend_direction": "down",
            "status": "warning" if avg_satisfaction < 4.0 else "good",
            "sparkline": data["trends"]["satisfaction"]
        },
        {
            "id": "critical_ratio",
            "name": "Critical Patient Ratio",
            "value": critical_ratio,
            "unit": "%",
            "baseline": 2.5,
            "delta": round(critical_ratio - 2.5, 1),
            "trend_direction": "up",
            "status": "warning" if critical_ratio > 3.0 else "good",
            "sparkline": [2.1, 2.2, 2.4, 2.3, 2.8, 2.9, critical_ratio]
        }
    ]
    
    # Hospital Health Score Gauge calculation (0-100)
    # Simple weighted average computation based on deviations from ideal
    health_score = 100
    if occupancy_percent > 85: health_score -= (occupancy_percent - 85)
    if avg_wait > 20: health_score -= (avg_wait - 20)
    if avg_satisfaction < 4.5: health_score -= ((4.5 - avg_satisfaction) * 10)
    
    return {
        "kpis": kpis,
        "health_score": max(0, min(100, round(health_score)))
    }
