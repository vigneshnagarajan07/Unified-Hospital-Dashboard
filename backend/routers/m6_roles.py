from fastapi import APIRouter
from data.hospital_data import get_hospital_data

router = APIRouter(prefix="/api/m6", tags=["Role Views"])

@router.get("/ceo")
async def get_ceo_view():
    data = get_hospital_data()
    # CEO cares about high-level KPIs, revenue, total anomalies
    return {
        "role": "CEO",
        "revenue": {
            "today": "₹18.4L",
            "mtd": "₹312.6L",
            "cost_per_patient": "₹3150"
        },
        "trends": {
            "revenue": data["trends"]["revenue_lakhs"]
        }
    }

@router.get("/cardiology")
async def get_cardiology_view():
    data = get_hospital_data()
    cardiology_dept = next(d for d in data["departments"] if d["id"] == "cardiology")
    return {
        "role": "Cardiology Head",
        "department_data": cardiology_dept,
        "surgeons_schedule": [
            {"doc": "Dr. Sharma", "status": "In Surgery", "time": "09:00 - 13:00"},
            {"doc": "Dr. Patel", "status": "OPD", "time": "10:00 - 16:00"},
            {"doc": "Dr. Iyer", "status": "On Call", "time": "14:00 - 20:00"}
        ]
    }

@router.get("/supervisor")
async def get_supervisor_view():
    data = get_hospital_data()
    # Floor Supervisor cares about real-time bed avail and immediate actions
    ward_status = []
    for dept in data["departments"]:
        ward_status.append({
            "ward": dept["name"],
            "available_beds": dept["beds"]["total"] - dept["beds"]["occupied"],
            "critical_patients": dept["critical_patients"],
            "pending_discharges": 2 if dept["id"] == "general_medicine" else 1,
            "staff_on_duty": f"{dept['staff']['nurses']} Nurses, {dept['staff']['doctors']} Doctors"
        })
        
    return {
        "role": "Floor Supervisor",
        "ward_status": ward_status,
        "urgent_alerts": [
            {"ward": "General Medicine", "alert": "Ward full. Need 2 discharges immediately."}
        ]
    }
