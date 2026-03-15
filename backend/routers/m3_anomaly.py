from fastapi import APIRouter
from data.hospital_data import get_hospital_data
from datetime import datetime

router = APIRouter(prefix="/api/m3", tags=["Anomaly Detection"])

@router.get("/anomalies")
async def get_anomalies():
    """
    M3 - Anomaly Detection
    Rule-based anomaly engine scanning all departments against baselines.
    """
    data = get_hospital_data()
    depts = data["departments"]
    anomalies = []
    
    current_time = datetime.now().isoformat()
    
    for dept in depts:
        # Check Bed Occupancy
        occ_total = dept["beds"]["total"]
        occ_occ = dept["beds"]["occupied"]
        occupancy_rate = (occ_occ / occ_total * 100) if occ_total else 0
        baseline_occ = 82.0 if dept["id"] == "general_medicine" else 80.0
        
        if occupancy_rate > 90:
            anomalies.append({
                "id": f"anom_occ_{dept['id']}",
                "department": dept["name"],
                "metric": "Bed Occupancy",
                "type": "bed_occupancy",
                "current_value": f"{round(occupancy_rate)}%",
                "baseline": f"{baseline_occ}%",
                "deviation_percent": round((occupancy_rate - baseline_occ) / baseline_occ * 100, 1),
                "severity": "critical",
                "timestamp": current_time,
                "description": f"Extremely high bed occupancy at {round(occupancy_rate)}%."
            })
        elif occupancy_rate > 85:
            anomalies.append({
                "id": f"anom_occ_{dept['id']}",
                "department": dept["name"],
                "metric": "Bed Occupancy",
                "type": "bed_occupancy",
                "current_value": f"{round(occupancy_rate)}%",
                "baseline": f"{baseline_occ}%",
                "deviation_percent": round((occupancy_rate - baseline_occ) / baseline_occ * 100, 1),
                "severity": "warning",
                "timestamp": current_time,
                "description": f"Elevated bed occupancy at {round(occupancy_rate)}%."
            })
            
        # Check OPD Wait Time
        wait = dept["opd"]["wait_time"]
        baseline_wait = dept["opd"]["baseline_wait_time"]
        if wait > baseline_wait * 1.3: # 30% above baseline
            anomalies.append({
                "id": f"anom_wait_{dept['id']}",
                "department": dept["name"],
                "metric": "OPD Wait Time",
                "type": "opd_wait",
                "current_value": f"{wait} min",
                "baseline": f"{baseline_wait} min",
                "deviation_percent": round((wait - baseline_wait) / baseline_wait * 100, 1),
                "severity": "critical" if wait > 40 else "warning",
                "timestamp": current_time,
                "description": f"Long wait times observed in {dept['name']} OPD."
            })
            
        # Check Surgeries
        if dept["surgeries"]["scheduled"] > 0 and dept["surgeries"]["completed"] < (dept["surgeries"]["scheduled"] / 2):
            anomalies.append({
                "id": f"anom_surg_{dept['id']}",
                "department": dept["name"],
                "metric": "Surgery Delay",
                "type": "surgery_delay",
                "current_value": f"{dept['surgeries']['completed']}/{dept['surgeries']['scheduled']}",
                "baseline": "100% on-track",
                "deviation_percent": 50.0,
                "severity": "warning",
                "timestamp": current_time,
                "description": "Surgery completion rate lagging significantly."
            })
            
        # Check Satisfaction
        if dept["satisfaction"] < 4.0:
            anomalies.append({
                "id": f"anom_sat_{dept['id']}",
                "department": dept["name"],
                "metric": "Satisfaction Drop",
                "type": "satisfaction_drop",
                "current_value": str(dept["satisfaction"]),
                "baseline": "4.2",
                "deviation_percent": round((dept["satisfaction"] - 4.2) / 4.2 * 100, 1),
                "severity": "info",
                "timestamp": current_time,
                "description": f"Patient satisfaction has dropped to {dept['satisfaction']}."
            })

    # Summary counts
    counts = {
        "critical": sum(1 for a in anomalies if a["severity"] == "critical"),
        "warning": sum(1 for a in anomalies if a["severity"] == "warning"),
        "info": sum(1 for a in anomalies if a["severity"] == "info")
    }

    return {
        "summary": counts,
        "anomalies": sorted(anomalies, key=lambda x: 0 if x["severity"]=="critical" else (1 if x["severity"]=="warning" else 2))
    }
