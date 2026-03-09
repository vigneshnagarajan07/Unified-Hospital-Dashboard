from fastapi import APIRouter
from routers.m3_anomaly import get_anomalies
from data.hospital_data import get_hospital_data

router = APIRouter(prefix="/api/m5", tags=["Recommendations"])

@router.get("/recommendations")
async def get_recommendations():
    """
    M5 - Recommendations
    Based on active anomalies, generate actionable steps.
    """
    anomalies_data = await get_anomalies()
    anomalies = anomalies_data["anomalies"]
    
    recommendations = []
    
    for anom in anomalies:
        if anom["type"] == "bed_occupancy" and anom["severity"] == "critical":
            recommendations.append({
                "id": f"rec_{anom['id']}_1",
                "title": "Halt Non-Emergency Admissions",
                "description": f"{anom['department']} is at {anom['current_value']} capacity. Divert elective admissions.",
                "department": anom["department"],
                "urgency": "immediate",
                "owner": "Admissions Desk",
                "impact_score": 10
            })
            recommendations.append({
                "id": f"rec_{anom['id']}_2",
                "title": "Expedite Pending Discharges",
                "description": "Review all patients pending discharge and clear paperwork immediately.",
                "department": anom["department"],
                "urgency": "immediate",
                "owner": "Floor Supervisor",
                "impact_score": 8
            })
        
        elif anom["type"] == "opd_wait" and anom["severity"] == "critical":
            recommendations.append({
                "id": f"rec_{anom['id']}_3",
                "title": "Deploy Standby Doctors",
                "description": f"Wait time is {anom['current_value']} in {anom['department']} OPD. Add 2 standby doctors.",
                "department": anom["department"],
                "urgency": "today",
                "owner": "Dept Head",
                "impact_score": 9
            })

        elif anom["type"] == "surgery_delay":
            recommendations.append({
                "id": f"rec_{anom['id']}_4",
                "title": "Optimize OT Turnover",
                "description": f"Surgery delays in {anom['department']}. Check sterilization turnaround times.",
                "department": anom["department"],
                "urgency": "today",
                "owner": "OT Manager",
                "impact_score": 7
            })
            
        elif anom["type"] == "satisfaction_drop":
            recommendations.append({
                "id": f"rec_{anom['id']}_5",
                "title": "Patient Feedback Review",
                "description": f"Review recent negative feedback forms for {anom['department']}.",
                "department": anom["department"],
                "urgency": "this_week",
                "owner": "Patient Experience",
                "impact_score": 5
            })

    # Sort by urgency (immediate > today > this_week) and impact_score
    urgency_map = {"immediate": 3, "today": 2, "this_week": 1}
    recommendations = sorted(recommendations, key=lambda x: (urgency_map[x["urgency"]], x["impact_score"]), reverse=True)

    return {"recommendations": recommendations}
