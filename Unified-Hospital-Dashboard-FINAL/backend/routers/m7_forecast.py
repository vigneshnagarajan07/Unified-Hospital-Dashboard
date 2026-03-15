from fastapi import APIRouter
from data.hospital_data import get_hospital_data
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/m7", tags=["Forecast"])

@router.get("/forecast")
async def get_forecast():
    """
    M7 - Predictive 48hr Forecast
    Rule-based forecast for next 48 hours (8 intervals of 6 hours).
    """
    data = get_hospital_data()
    
    # Calculate current baseline stats
    depts = data["departments"]
    total_beds = sum(d["beds"]["total"] for d in depts)
    occupied_beds = sum(d["beds"]["occupied"] for d in depts)
    current_occ = (occupied_beds / total_beds * 100) if total_beds else 0
    current_wait = sum(d["opd"]["wait_time"] for d in depts) / len(depts)
    current_vol = sum(d["opd"]["patients_today"] for d in depts)

    forecast_data = []
    current_time = datetime.now()
    
    # Simple rule based fluctuation pattern (diurnal cycle)
    # Peak at 12pm, trough at 3am
    pattern = [0.9, 1.1, 1.3, 1.1, 0.9, 0.7, 0.6, 0.8]
    
    for i in range(8):
        future_time = current_time + timedelta(hours=(i+1)*6)
        time_label = future_time.strftime("%a %H:%00")
        
        # apply basic pattern + some trending upward if current_occ is high
        trend_factor = 1.0 + (i * 0.01) if current_occ > 85 else 1.0
        
        predicted_occ = min(100.0, current_occ * pattern[i % 8] * trend_factor)
        predicted_vol = round((current_vol / 4) * pattern[i % 8]) # volume per 6 hour block
        predicted_wait = min(120.0, current_wait * pattern[i % 8] * trend_factor)
        
        threshold_breach = predicted_occ > 90 or predicted_wait > 40
        
        forecast_data.append({
            "interval": time_label,
            "predicted_occupancy": round(predicted_occ, 1),
            "predicted_volume": predicted_vol,
            "predicted_wait": round(predicted_wait, 1),
            "confidence_lower": round(predicted_occ * 0.95, 1),
            "confidence_upper": round(min(100, predicted_occ * 1.05), 1),
            "threshold_breach": threshold_breach
        })
        
    return {
        "forecast": forecast_data,
        "alerts": [f["interval"] for f in forecast_data if f["threshold_breach"]]
    }
