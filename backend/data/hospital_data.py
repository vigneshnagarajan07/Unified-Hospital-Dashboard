MOCK_HOSPITAL_DATA = {
    "hospital_info": {
        "name": "GKM General Hospital",
        "location": "Chennai, Tamil Nadu",
        "accreditation": "NABH Accredited"
    },
    "departments": [
        {
            "id": "cardiology",
            "name": "Cardiology",
            "beds": {"total": 60, "occupied": 47},
            "opd": {"wait_time": 47, "baseline_wait_time": 34, "patients_today": 84},
            "surgeries": {"scheduled": 6, "completed": 4},
            "staff": {"doctors": 8, "nurses": 14},
            "satisfaction": 3.9,
            "critical_patients": 5,
            "icu": {"total": 10, "occupied": 7}
        },
        {
            "id": "general_medicine",
            "name": "General Medicine",
            "beds": {"total": 120, "occupied": 116},
            "opd": {"wait_time": 22, "baseline_wait_time": 22, "patients_today": 210},
            "surgeries": {"scheduled": 2, "completed": 2},
            "staff": {"doctors": 14, "nurses": 28},
            "satisfaction": 4.1,
            "critical_patients": 8,
            "icu": {"total": 0, "occupied": 0}
        },
        {
            "id": "orthopedics",
            "name": "Orthopedics",
            "beds": {"total": 50, "occupied": 33},
            "opd": {"wait_time": 18, "baseline_wait_time": 20, "patients_today": 55},
            "surgeries": {"scheduled": 8, "completed": 7},
            "staff": {"doctors": 6, "nurses": 12},
            "satisfaction": 4.4,
            "critical_patients": 1,
            "icu": {"total": 0, "occupied": 0}
        },
        {
            "id": "pediatrics",
            "name": "Pediatrics",
            "beds": {"total": 70, "occupied": 50},
            "opd": {"wait_time": 15, "baseline_wait_time": 18, "patients_today": 93},
            "surgeries": {"scheduled": 1, "completed": 1},
            "staff": {"doctors": 7, "nurses": 16},
            "satisfaction": 4.6,
            "critical_patients": 3,
            "icu": {"total": 8, "occupied": 3}
        },
        {
            "id": "emergency",
            "name": "Emergency",
            "beds": {"total": 40, "occupied": 35},
            "opd": {"wait_time": 8, "baseline_wait_time": 10, "patients_today": 142},
            "surgeries": {"scheduled": 0, "completed": 0},
            "staff": {"doctors": 10, "nurses": 20},
            "satisfaction": 3.7,
            "critical_patients": 12,
            "icu": {"total": 6, "occupied": 6}
        },
        {
            "id": "obstetrics",
            "name": "Obstetrics",
            "beds": {"total": 55, "occupied": 38},
            "opd": {"wait_time": 20, "baseline_wait_time": 22, "patients_today": 68},
            "surgeries": {"scheduled": 4, "completed": 4},
            "staff": {"doctors": 6, "nurses": 14},
            "satisfaction": 4.5,
            "critical_patients": 2,
            "icu": {"total": 4, "occupied": 1}
        }
    ],
    "trends": {
        "bed_occupancy_percent": [74, 76, 72, 78, 80, 77, 79],
        "opd_wait_min": [19, 21, 20, 24, 23, 25, 22],
        "patients_day": [521, 548, 503, 567, 591, 558, 584],
        "satisfaction": [4.2, 4.1, 4.3, 4.0, 4.1, 4.2, 4.1],
        "revenue_lakhs": [16.2, 17.1, 15.8, 18.3, 19.1, 17.6, 18.4]
    }
}

def get_hospital_data():
    return MOCK_HOSPITAL_DATA
