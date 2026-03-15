# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# hospital_data.py — Expanded Mock Hospital Database
# FIX: Added 7-day per-department KPI history, pharmacy data,
#      30-day readmission rates, billing collection trend,
#      lab TAT history, and richer trend arrays
# ─────────────────────────────────────────────────────────────

from datetime import datetime

APOLLO_HOSPITAL_INFO = {
    "name"          : "PrimeCare Hospital",
    "location"      : "Chennai, Tamil Nadu",
    "address"       : "21 Greams Lane, Off Greams Road, Chennai - 600006",
    "accreditation" : "NABH Accredited",
    "established"   : "1983",
    "total_floors"  : 7,
    "emergency_contact" : "+91 44 2829 0200",
    "last_updated"  : datetime.now().isoformat(),
}

# ── Department Data ───────────────────────────────────────────
# Intentional anomalies:
#   1. Cardiology OPD wait = 47 min  (+38% vs baseline 34)
#   2. General Medicine bed occupancy = 97% (+18% vs baseline 82%)

APOLLO_DEPARTMENTS = [
    {
        "id"                    : "cardiology",
        "name"                  : "Cardiology",
        "head_doctor_id"        : "DOC001",
        "head_doctor_name"      : "Dr. Ramesh Iyer",
        "floor"                 : "3rd Floor, Block A",
        "total_beds"            : 60,
        "occupied_beds"         : 47,
        "opd_patients_today"    : 84,
        "opd_wait_time_min"     : 47,       # ANOMALY +38%
        "opd_baseline_wait_min" : 34,
        "surgeries_scheduled"   : 6,
        "surgeries_completed"   : 4,
        "staff_doctors"         : 8,
        "staff_nurses"          : 14,
        "avg_length_of_stay"    : 4.2,
        "patient_satisfaction"  : 3.9,
        "critical_patients"     : 5,
        "icu_beds_total"        : 10,
        "icu_beds_occupied"     : 7,
        "revenue_today_lakh"    : 4.2,
        "readmission_rate_30d"  : 8.2,      # % patients readmitted within 30 days
        "pharmacy_orders_today" : 62,
        "pharmacy_fulfilled_pct": 94.0,
        "avg_lab_tat_hours"     : 4.2,
        "billing_collection_pct": 86.5,
        "color"                 : "#0EA5E9",
    },
    {
        "id"                    : "general_medicine",
        "name"                  : "General Medicine",
        "head_doctor_id"        : "DOC002",
        "head_doctor_name"      : "Dr. Priya Subramaniam",
        "floor"                 : "2nd Floor, Block B",
        "total_beds"            : 120,
        "occupied_beds"         : 116,      # ANOMALY 97%
        "opd_patients_today"    : 210,
        "opd_wait_time_min"     : 22,
        "opd_baseline_wait_min" : 20,
        "surgeries_scheduled"   : 2,
        "surgeries_completed"   : 2,
        "staff_doctors"         : 14,
        "staff_nurses"          : 28,
        "avg_length_of_stay"    : 3.1,
        "patient_satisfaction"  : 4.1,
        "critical_patients"     : 8,
        "icu_beds_total"        : 0,
        "icu_beds_occupied"     : 0,
        "revenue_today_lakh"    : 6.8,
        "readmission_rate_30d"  : 6.1,
        "pharmacy_orders_today" : 148,
        "pharmacy_fulfilled_pct": 91.0,
        "avg_lab_tat_hours"     : 3.8,
        "billing_collection_pct": 82.0,
        "color"                 : "#10B981",
    },
    {
        "id"                    : "orthopedics",
        "name"                  : "Orthopedics",
        "head_doctor_id"        : "DOC003",
        "head_doctor_name"      : "Dr. Karthik Menon",
        "floor"                 : "4th Floor, Block A",
        "total_beds"            : 50,
        "occupied_beds"         : 33,
        "opd_patients_today"    : 55,
        "opd_wait_time_min"     : 18,
        "opd_baseline_wait_min" : 20,
        "surgeries_scheduled"   : 8,
        "surgeries_completed"   : 7,
        "staff_doctors"         : 6,
        "staff_nurses"          : 12,
        "avg_length_of_stay"    : 5.8,
        "patient_satisfaction"  : 4.4,
        "critical_patients"     : 1,
        "icu_beds_total"        : 0,
        "icu_beds_occupied"     : 0,
        "revenue_today_lakh"    : 3.1,
        "readmission_rate_30d"  : 3.4,
        "pharmacy_orders_today" : 38,
        "pharmacy_fulfilled_pct": 97.0,
        "avg_lab_tat_hours"     : 5.1,
        "billing_collection_pct": 91.0,
        "color"                 : "#F59E0B",
    },
    {
        "id"                    : "pediatrics",
        "name"                  : "Pediatrics",
        "head_doctor_id"        : "DOC004",
        "head_doctor_name"      : "Dr. Anitha Krishnan",
        "floor"                 : "1st Floor, Block C",
        "total_beds"            : 70,
        "occupied_beds"         : 50,
        "opd_patients_today"    : 93,
        "opd_wait_time_min"     : 15,
        "opd_baseline_wait_min" : 18,
        "surgeries_scheduled"   : 1,
        "surgeries_completed"   : 1,
        "staff_doctors"         : 7,
        "staff_nurses"          : 16,
        "avg_length_of_stay"    : 2.3,
        "patient_satisfaction"  : 4.6,
        "critical_patients"     : 3,
        "icu_beds_total"        : 8,
        "icu_beds_occupied"     : 3,
        "revenue_today_lakh"    : 2.8,
        "readmission_rate_30d"  : 2.8,
        "pharmacy_orders_today" : 74,
        "pharmacy_fulfilled_pct": 98.5,
        "avg_lab_tat_hours"     : 3.5,
        "billing_collection_pct": 89.5,
        "color"                 : "#8B5CF6",
    },
    {
        "id"                    : "emergency",
        "name"                  : "Emergency",
        "head_doctor_id"        : "DOC005",
        "head_doctor_name"      : "Dr. Vijay Nair",
        "floor"                 : "Ground Floor, Block D",
        "total_beds"            : 40,
        "occupied_beds"         : 35,
        "opd_patients_today"    : 142,
        "opd_wait_time_min"     : 8,
        "opd_baseline_wait_min" : 10,
        "surgeries_scheduled"   : 0,
        "surgeries_completed"   : 0,
        "staff_doctors"         : 10,
        "staff_nurses"          : 20,
        "avg_length_of_stay"    : 0.5,
        "patient_satisfaction"  : 3.7,
        "critical_patients"     : 12,
        "icu_beds_total"        : 6,
        "icu_beds_occupied"     : 6,       # ANOMALY: full ICU
        "revenue_today_lakh"    : 1.5,
        "readmission_rate_30d"  : 4.9,
        "pharmacy_orders_today" : 95,
        "pharmacy_fulfilled_pct": 99.0,
        "avg_lab_tat_hours"     : 1.8,
        "billing_collection_pct": 72.0,    # low — many uninsured emergencies
        "color"                 : "#EF4444",
    },
    {
        "id"                    : "obstetrics",
        "name"                  : "Obstetrics & Gynaecology",
        "head_doctor_id"        : "DOC006",
        "head_doctor_name"      : "Dr. Meena Rajagopalan",
        "floor"                 : "5th Floor, Block B",
        "total_beds"            : 55,
        "occupied_beds"         : 38,
        "opd_patients_today"    : 68,
        "opd_wait_time_min"     : 20,
        "opd_baseline_wait_min" : 22,
        "surgeries_scheduled"   : 4,
        "surgeries_completed"   : 4,
        "staff_doctors"         : 6,
        "staff_nurses"          : 14,
        "avg_length_of_stay"    : 2.8,
        "patient_satisfaction"  : 4.5,
        "critical_patients"     : 2,
        "icu_beds_total"        : 4,
        "icu_beds_occupied"     : 1,
        "revenue_today_lakh"    : 2.1,
        "readmission_rate_30d"  : 1.8,
        "pharmacy_orders_today" : 52,
        "pharmacy_fulfilled_pct": 96.5,
        "avg_lab_tat_hours"     : 4.0,
        "billing_collection_pct": 88.0,
        "color"                 : "#EC4899",
    },
]

# ── 7-day hospital-wide trend data ────────────────────────────
APOLLO_TREND_DATA = {
    "bed_occupancy" : [74, 76, 72, 78, 80, 77, 79],
    "opd_wait"      : [19, 21, 20, 24, 23, 25, 22],
    "patients"      : [521, 548, 503, 567, 591, 558, 584],
    "satisfaction"  : [4.2, 4.1, 4.3, 4.0, 4.1, 4.2, 4.1],
    "surgery_rate"  : [88, 85, 90, 83, 82, 86, 82],
    "revenue_lakh"  : [16.2, 17.1, 15.8, 18.3, 19.1, 17.6, 18.4],
    "dates"         : ["03 Mar", "04 Mar", "05 Mar",
                       "06 Mar", "07 Mar", "08 Mar", "09 Mar"],
    # Per-department 7-day bed occupancy history (%)
    "dept_bed_occupancy": {
        "cardiology"      : [72, 75, 71, 74, 76, 74, 78],
        "general_medicine": [84, 86, 83, 88, 91, 89, 97],   # trending up → anomaly
        "orthopedics"     : [58, 60, 55, 62, 64, 61, 66],
        "pediatrics"      : [65, 67, 63, 68, 70, 68, 71],
        "emergency"       : [80, 82, 78, 83, 85, 84, 87],
        "obstetrics"      : [60, 62, 58, 64, 66, 65, 69],
    },
    # Per-department 7-day OPD wait time history (min)
    "dept_opd_wait": {
        "cardiology"      : [32, 34, 31, 35, 36, 38, 47],   # sharp spike today
        "general_medicine": [19, 21, 20, 22, 21, 22, 22],
        "orthopedics"     : [20, 19, 21, 18, 20, 19, 18],
        "pediatrics"      : [18, 17, 19, 16, 15, 16, 15],
        "emergency"       : [10, 9, 11, 8, 9, 8, 8],
        "obstetrics"      : [22, 21, 23, 20, 21, 20, 20],
    },
    # 7-day billing collection rate (%)
    "billing_collection": [85.2, 84.8, 86.1, 83.9, 82.5, 84.2, 83.8],
    # 7-day average lab TAT (hours)
    "lab_tat"           : [3.9, 4.1, 3.8, 4.3, 4.0, 4.2, 3.9],
    # 7-day NPS scores
    "nps"               : [72, 70, 74, 68, 71, 73, 71],
    # 7-day readmission rates (%)
    "readmission_rate"  : [4.8, 5.1, 4.6, 5.3, 4.9, 5.0, 4.9],
}

# ── Per-department bed layout for floor supervisor ────────────
APOLLO_BED_LAYOUT = {
    "cardiology": {
        "ward_3a": {
            "ward_label": "Ward 3A",
            "beds": [
                {"bed_id": f"3A-{i:02d}", "status": "occupied" if i <= 24 else "available",
                 "patient_id": f"APL-2024-{800+i}" if i <= 24 else None,
                 "patient_name": f"Patient {i}" if i <= 24 else None,
                 "admission_days": (i % 5) + 1 if i <= 24 else None,
                 "maintenance": False}
                for i in range(1, 31)
            ]
        },
        "ward_3b": {
            "ward_label": "Ward 3B (ICU)",
            "beds": [
                {"bed_id": f"3B-{i:02d}", "status": "occupied" if i <= 7 else "available",
                 "patient_id": f"APL-2024-{830+i}" if i <= 7 else None,
                 "patient_name": f"ICU Patient {i}" if i <= 7 else None,
                 "admission_days": (i % 3) + 1 if i <= 7 else None,
                 "maintenance": i == 9}
                for i in range(1, 11)
            ]
        }
    },
    "general_medicine": {
        "ward_2a": {
            "ward_label": "Ward 2A",
            "beds": [
                {"bed_id": f"2A-{i:02d}", "status": "occupied" if i <= 38 else "available",
                 "patient_id": f"APL-2024-{700+i}" if i <= 38 else None,
                 "patient_name": f"Patient {i}" if i <= 38 else None,
                 "admission_days": (i % 6) + 1 if i <= 38 else None,
                 "maintenance": i == 40}
                for i in range(1, 41)
            ]
        },
        "ward_2b": {
            "ward_label": "Ward 2B",
            "beds": [
                {"bed_id": f"2B-{i:02d}", "status": "occupied" if i <= 40 else "available",
                 "patient_id": f"APL-2024-{740+i}" if i <= 40 else None,
                 "patient_name": f"Patient {i}" if i <= 40 else None,
                 "admission_days": (i % 4) + 1 if i <= 40 else None,
                 "maintenance": False}
                for i in range(1, 41)
            ]
        },
        "ward_2c": {
            "ward_label": "Ward 2C",
            "beds": [
                {"bed_id": f"2C-{i:02d}", "status": "occupied" if i <= 38 else "available",
                 "patient_id": f"APL-2024-{780+i}" if i <= 38 else None,
                 "patient_name": f"Patient {i}" if i <= 38 else None,
                 "admission_days": (i % 5) + 2 if i <= 38 else None,
                 "maintenance": False}
                for i in range(1, 41)
            ]
        }
    },
    "orthopedics": {
        "ward_4a": {
            "ward_label": "Ward 4A",
            "beds": [
                {"bed_id": f"4A-{i:02d}", "status": "occupied" if i <= 33 else "available",
                 "patient_id": f"APL-2024-{600+i}" if i <= 33 else None,
                 "patient_name": f"Patient {i}" if i <= 33 else None,
                 "admission_days": (i % 7) + 2 if i <= 33 else None,
                 "maintenance": False}
                for i in range(1, 51)
            ]
        }
    },
    "pediatrics": {
        "ward_1a": {
            "ward_label": "Ward 1A",
            "beds": [
                {"bed_id": f"1A-{i:02d}", "status": "occupied" if i <= 25 else "available",
                 "patient_id": f"APL-2024-{500+i}" if i <= 25 else None,
                 "patient_name": f"Paed Patient {i}" if i <= 25 else None,
                 "admission_days": (i % 3) + 1 if i <= 25 else None,
                 "maintenance": False}
                for i in range(1, 36)
            ]
        },
        "ward_1b": {
            "ward_label": "Ward 1B (PICU)",
            "beds": [
                {"bed_id": f"1B-{i:02d}", "status": "occupied" if i <= 3 else "available",
                 "patient_id": f"APL-2024-{535+i}" if i <= 3 else None,
                 "patient_name": f"PICU Patient {i}" if i <= 3 else None,
                 "admission_days": (i % 2) + 1 if i <= 3 else None,
                 "maintenance": False}
                for i in range(1, 9)
            ]
        }
    },
    "emergency": {
        "ward_g1": {
            "ward_label": "Emergency Bay",
            "beds": [
                {"bed_id": f"ER-{i:02d}", "status": "occupied" if i <= 35 else "available",
                 "patient_id": f"APL-2024-{400+i}" if i <= 35 else None,
                 "patient_name": f"ER Patient {i}" if i <= 35 else None,
                 "admission_days": 0 if i <= 35 else None,
                 "maintenance": False}
                for i in range(1, 41)
            ]
        }
    },
    "obstetrics": {
        "ward_5a": {
            "ward_label": "Ward 5A",
            "beds": [
                {"bed_id": f"5A-{i:02d}", "status": "occupied" if i <= 22 else "available",
                 "patient_id": f"APL-2024-{300+i}" if i <= 22 else None,
                 "patient_name": f"Patient {i}" if i <= 22 else None,
                 "admission_days": (i % 3) + 1 if i <= 22 else None,
                 "maintenance": False}
                for i in range(1, 28)
            ]
        },
        "ward_5b": {
            "ward_label": "Ward 5B",
            "beds": [
                {"bed_id": f"5B-{i:02d}", "status": "occupied" if i <= 16 else "available",
                 "patient_id": f"APL-2024-{327+i}" if i <= 16 else None,
                 "patient_name": f"Patient {i}" if i <= 16 else None,
                 "admission_days": (i % 2) + 1 if i <= 16 else None,
                 "maintenance": False}
                for i in range(1, 29)
            ]
        }
    },
}

# ── Pharmacy data ─────────────────────────────────────────────
APOLLO_PHARMACY = {
    "total_orders_today"     : 469,
    "fulfilled_orders"       : 443,
    "pending_orders"         : 26,
    "fulfillment_rate_pct"   : 94.5,
    "low_stock_alerts"       : [
        {"drug": "Enoxaparin 40mg", "current_stock": 48, "reorder_level": 100, "department": "Orthopedics"},
        {"drug": "Adrenaline 1mg", "current_stock": 12, "reorder_level": 50,  "department": "Emergency"},
        {"drug": "Oxytocin 5IU",   "current_stock": 30, "reorder_level": 75,  "department": "Obstetrics"},
    ],
    "top_drugs_dispensed": [
        {"drug": "Paracetamol 500mg", "units": 342},
        {"drug": "Aspirin 75mg",      "units": 215},
        {"drug": "Metformin 500mg",   "units": 187},
        {"drug": "Atorvastatin 40mg", "units": 164},
        {"drug": "Pantoprazole 40mg", "units": 158},
    ],
}

# ── Revenue & Finance ─────────────────────────────────────────
APOLLO_FINANCE = {
    "revenue_today_lakh"    : 18.4,
    "revenue_mtd_lakh"      : 312.6,
    "revenue_target_lakh"   : 350.0,
    "cost_per_patient"      : 3150,
    "avg_bill_inpatient"    : 28400,
    "avg_bill_outpatient"   : 1850,
    "insurance_claims_pct"  : 64.2,
    "pending_bills_lakh"    : 12.8,
    "collection_rate_pct"   : 83.8,
    "insurance_pending_count": 47,
    "insurance_denied_count" : 12,
}
