# Module : Data Aggregation API
# Function:  Exposes a single GET endpoint that aggregates and
#          returns hospital-wide data including department
#          stats, summary totals, and 7-day trend history.

#Imports

# APIRouter: Used to create a modular group of routes.
# Instead of defining all routes in one file (main.py),
# we use APIRouter to keep each module in its own file.
from fastapi import APIRouter

# Import the function that returns our mock hospital dataset.
# In production, this would be replaced with a real DB call.
from data.hospital_data import get_hospital_data

router = APIRouter(prefix="/api/m1", tags=["Data Aggregation"])

#This function runs when user visits /api/m1/data
@router.get("/data")
async def get_aggregation_data():
    """
    M1 - Data Aggregation
    Returns the raw hospital data with all 6 departments and 7-day trends.
    """
    #Load Hospital data
    data = get_hospital_data()
    
    # Calculate some basic hospital-wide totals for the summary tiles
    total_beds = sum(dept["beds"]["total"] for dept in data["departments"])
    occupied_beds = sum(dept["beds"]["occupied"] for dept in data["departments"])
    total_opd_patients = sum(dept["opd"]["patients_today"] for dept in data["departments"])
    avg_opd_wait = sum(dept["opd"]["wait_time"] for dept in data["departments"]) / len(data["departments"])
    total_staff = sum(dept["staff"]["doctors"] + dept["staff"]["nurses"] for dept in data["departments"])
    
    #Summary report 
    summary = {
        "total_beds": total_beds,
        "occupied_beds": occupied_beds,
        "occupancy_rate": round((occupied_beds / total_beds) * 100, 1) if total_beds > 0 else 0,
        "total_opd_patients": total_opd_patients,
        "avg_opd_wait": round(avg_opd_wait, 1),
        "total_departments": len(data["departments"]),
        "total_staff": total_staff
    }
    
    #Sending everything back as JSON response
    return {
        "hospital_info": data["hospital_info"],
        "summary": summary,
        "departments": data["departments"],
        "trends": data["trends"]
    }
