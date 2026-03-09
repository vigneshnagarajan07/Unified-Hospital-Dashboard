from fastapi import APIRouter
from data.hospital_data import get_hospital_data

router = APIRouter(prefix="/api/m1", tags=["Data Aggregation"])

@router.get("/data")
async def get_aggregation_data():
    """
    M1 - Data Aggregation
    Returns the raw hospital data with all 6 departments and 7-day trends.
    """
    data = get_hospital_data()
    
    # Calculate some basic hospital-wide totals for the summary tiles
    total_beds = sum(dept["beds"]["total"] for dept in data["departments"])
    occupied_beds = sum(dept["beds"]["occupied"] for dept in data["departments"])
    total_opd_patients = sum(dept["opd"]["patients_today"] for dept in data["departments"])
    avg_opd_wait = sum(dept["opd"]["wait_time"] for dept in data["departments"]) / len(data["departments"])
    total_staff = sum(dept["staff"]["doctors"] + dept["staff"]["nurses"] for dept in data["departments"])
    
    summary = {
        "total_beds": total_beds,
        "occupied_beds": occupied_beds,
        "occupancy_rate": round((occupied_beds / total_beds) * 100, 1) if total_beds > 0 else 0,
        "total_opd_patients": total_opd_patients,
        "avg_opd_wait": round(avg_opd_wait, 1),
        "total_departments": len(data["departments"]),
        "total_staff": total_staff
    }
    
    return {
        "hospital_info": data["hospital_info"],
        "summary": summary,
        "departments": data["departments"],
        "trends": data["trends"]
    }
