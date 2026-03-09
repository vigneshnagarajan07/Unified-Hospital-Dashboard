# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# hospital_data.py — Master hospital & department data
# Single source of truth for all modules
# ─────────────────────────────────────────────────────────────

from datetime import datetime

# ── Hospital Meta ─────────────────────────────────────────────

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
# 2 intentional anomalies:
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
        "icu_beds_occupied"     : 6,
        "revenue_today_lakh"    : 1.5,
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
        "color"                 : "#EC4899",
    },
]

# ── 7-day trend data ──────────────────────────────────────────

APOLLO_TREND_DATA = {
    "bed_occupancy" : [74, 76, 72, 78, 80, 77, 79],
    "opd_wait"      : [19, 21, 20, 24, 23, 25, 22],
    "patients"      : [521, 548, 503, 567, 591, 558, 584],
    "satisfaction"  : [4.2, 4.1, 4.3, 4.0, 4.1, 4.2, 4.1],
    "surgery_rate"  : [88, 85, 90, 83, 82, 86, 82],
    "revenue_lakh"  : [16.2, 17.1, 15.8, 18.3, 19.1, 17.6, 18.4],
    "dates"         : ["03 Mar", "04 Mar", "05 Mar",
                       "06 Mar", "07 Mar", "08 Mar", "09 Mar"],
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
}