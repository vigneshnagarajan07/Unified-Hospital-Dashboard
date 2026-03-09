# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# patient_data.py — Patient records mock database
# 10 realistic inpatients with full journey data
# ─────────────────────────────────────────────────────────────

from datetime import datetime, timedelta

today = datetime.now()

APOLLO_PATIENTS = [
    {
        "patient_id"        : "APL-2024-0847",
        "name"              : "Senthil Kumar",
        "age"               : 58,
        "gender"            : "Male",
        "blood_group"       : "B+",
        "phone"             : "+91 98401 23456",
        "address"           : "14 Anna Nagar, Chennai",
        "department_id"     : "cardiology",
        "department_name"   : "Cardiology",
        "assigned_doctor_id": "DOC001",
        "assigned_doctor"   : "Dr. Ramesh Iyer",
        "ward"              : "Ward 3A",
        "bed_number"        : "3A-12",
        "admission_date"    : (today - timedelta(days=3)).strftime("%Y-%m-%d"),
        "expected_discharge": (today + timedelta(days=2)).strftime("%Y-%m-%d"),
        "diagnosis"         : "Acute Myocardial Infarction",
        "status"            : "admitted",
        "is_critical"       : False,

        "vitals" : [
            {
                "recorded_at"   : (today - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M"),
                "blood_pressure": "128/82",
                "pulse_bpm"     : 74,
                "temperature_f" : 98.6,
                "spo2_pct"      : 98,
                "weight_kg"     : 72.4,
            },
            {
                "recorded_at"   : (today - timedelta(hours=8)).strftime("%Y-%m-%d %H:%M"),
                "blood_pressure": "134/88",
                "pulse_bpm"     : 78,
                "temperature_f" : 99.1,
                "spo2_pct"      : 97,
                "weight_kg"     : 72.4,
            },
        ],

        "prescriptions" : [
            {
                "prescribed_date" : today.strftime("%Y-%m-%d"),
                "doctor_name"     : "Dr. Ramesh Iyer",
                "medications" : [
                    { "name": "Aspirin",       "dose": "75mg",   "frequency": "Once daily",  "duration": "30 days", "instructions": "After food" },
                    { "name": "Atorvastatin",  "dose": "40mg",   "frequency": "Once nightly","duration": "30 days", "instructions": "After dinner" },
                    { "name": "Metoprolol",    "dose": "25mg",   "frequency": "Twice daily", "duration": "14 days", "instructions": "Before food" },
                    { "name": "Clopidogrel",   "dose": "75mg",   "frequency": "Once daily",  "duration": "30 days", "instructions": "After food" },
                ],
                "notes" : "Avoid strenuous activity. Low sodium diet.",
            },
        ],

        "lab_reports" : [
            {
                "report_id"     : "LAB-2024-3847",
                "test_name"     : "Complete Blood Count",
                "ordered_by"    : "Dr. Ramesh Iyer",
                "ordered_date"  : (today - timedelta(days=2)).strftime("%Y-%m-%d"),
                "result_date"   : (today - timedelta(days=1)).strftime("%Y-%m-%d"),
                "status"        : "completed",
                "results" : [
                    { "parameter": "Haemoglobin",   "value": "13.2", "unit": "g/dL",   "reference": "13.0-17.0", "flag": "normal"  },
                    { "parameter": "WBC Count",     "value": "11200","unit": "cells/μL","reference": "4000-11000","flag": "high"    },
                    { "parameter": "Platelet Count","value": "198000","unit": "cells/μL","reference": "150000-400000","flag": "normal"},
                    { "parameter": "RBC Count",     "value": "4.8",  "unit": "mil/μL", "reference": "4.5-5.9",  "flag": "normal"  },
                ],
            },
            {
                "report_id"     : "LAB-2024-3901",
                "test_name"     : "Lipid Profile",
                "ordered_by"    : "Dr. Ramesh Iyer",
                "ordered_date"  : (today - timedelta(days=2)).strftime("%Y-%m-%d"),
                "result_date"   : (today - timedelta(days=1)).strftime("%Y-%m-%d"),
                "status"        : "completed",
                "results" : [
                    { "parameter": "Total Cholesterol","value": "218","unit": "mg/dL","reference": "<200",    "flag": "high"   },
                    { "parameter": "LDL",              "value": "142","unit": "mg/dL","reference": "<100",    "flag": "high"   },
                    { "parameter": "HDL",              "value": "38", "unit": "mg/dL","reference": ">40",     "flag": "low"    },
                    { "parameter": "Triglycerides",    "value": "186","unit": "mg/dL","reference": "<150",    "flag": "high"   },
                ],
            },
        ],

        "bill_estimate" : {
            "room_charges_lakh"     : 0.45,
            "doctor_fees_lakh"      : 0.30,
            "pharmacy_lakh"         : 0.18,
            "lab_charges_lakh"      : 0.12,
            "procedure_charges_lakh": 1.20,
            "total_lakh"            : 2.25,
            "insurance_covered_lakh": 1.80,
            "patient_due_lakh"      : 0.45,
            "insurance_provider"    : "Star Health Insurance",
            "claim_status"          : "approved",
        },

        "discharge_checklist" : [
            { "task": "Final vitals recorded",          "completed": True  },
            { "task": "Discharge summary prepared",     "completed": True  },
            { "task": "Prescriptions printed",          "completed": False },
            { "task": "Insurance claim processed",      "completed": True  },
            { "task": "Follow-up appointment scheduled","completed": False },
            { "task": "Patient education done",         "completed": False },
        ],
    },

    {
        "patient_id"        : "APL-2024-0901",
        "name"              : "Lakshmi Devi",
        "age"               : 34,
        "gender"            : "Female",
        "blood_group"       : "O+",
        "phone"             : "+91 94440 78901",
        "address"           : "7 Besant Nagar, Chennai",
        "department_id"     : "obstetrics",
        "department_name"   : "Obstetrics & Gynaecology",
        "assigned_doctor_id": "DOC006",
        "assigned_doctor"   : "Dr. Meena Rajagopalan",
        "ward"              : "Ward 5B",
        "bed_number"        : "5B-04",
        "admission_date"    : (today - timedelta(days=1)).strftime("%Y-%m-%d"),
        "expected_discharge": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
        "diagnosis"         : "Normal Delivery — Post-partum care",
        "status"            : "admitted",
        "is_critical"       : False,

        "vitals" : [
            {
                "recorded_at"   : (today - timedelta(hours=3)).strftime("%Y-%m-%d %H:%M"),
                "blood_pressure": "118/76",
                "pulse_bpm"     : 82,
                "temperature_f" : 98.8,
                "spo2_pct"      : 99,
                "weight_kg"     : 64.2,
            },
        ],

        "prescriptions" : [
            {
                "prescribed_date" : today.strftime("%Y-%m-%d"),
                "doctor_name"     : "Dr. Meena Rajagopalan",
                "medications" : [
                    { "name": "Iron + Folic Acid", "dose": "1 tablet", "frequency": "Once daily", "duration": "90 days", "instructions": "After food" },
                    { "name": "Calcium",           "dose": "500mg",    "frequency": "Twice daily","duration": "60 days", "instructions": "After meals" },
                    { "name": "Vitamin D3",        "dose": "60000 IU", "frequency": "Weekly",     "duration": "8 weeks", "instructions": "With milk"  },
                ],
                "notes" : "Breastfeeding advised. Rest for 6 weeks.",
            },
        ],

        "lab_reports" : [
            {
                "report_id"     : "LAB-2024-4012",
                "test_name"     : "Post-delivery Blood Work",
                "ordered_by"    : "Dr. Meena Rajagopalan",
                "ordered_date"  : today.strftime("%Y-%m-%d"),
                "result_date"   : None,
                "status"        : "pending",
                "results"       : [],
            },
        ],

        "bill_estimate" : {
            "room_charges_lakh"     : 0.18,
            "doctor_fees_lakh"      : 0.25,
            "pharmacy_lakh"         : 0.08,
            "lab_charges_lakh"      : 0.06,
            "procedure_charges_lakh": 0.45,
            "total_lakh"            : 1.02,
            "insurance_covered_lakh": 0.80,
            "patient_due_lakh"      : 0.22,
            "insurance_provider"    : "United India Insurance",
            "claim_status"          : "processing",
        },

        "discharge_checklist" : [
            { "task": "Final vitals recorded",          "completed": False },
            { "task": "Discharge summary prepared",     "completed": False },
            { "task": "Prescriptions printed",          "completed": False },
            { "task": "Insurance claim processed",      "completed": False },
            { "task": "Follow-up appointment scheduled","completed": False },
            { "task": "Baby birth certificate initiated","completed": True },
        ],
    },

    {
        "patient_id"        : "APL-2024-0923",
        "name"              : "Arjun Sharma",
        "age"               : 42,
        "gender"            : "Male",
        "blood_group"       : "A+",
        "phone"             : "+91 98765 43210",
        "address"           : "32 T Nagar, Chennai",
        "department_id"     : "orthopedics",
        "department_name"   : "Orthopedics",
        "assigned_doctor_id": "DOC003",
        "assigned_doctor"   : "Dr. Karthik Menon",
        "ward"              : "Ward 4A",
        "bed_number"        : "4A-07",
        "admission_date"    : (today - timedelta(days=5)).strftime("%Y-%m-%d"),
        "expected_discharge": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
        "diagnosis"         : "Right knee total replacement surgery",
        "status"            : "admitted",
        "is_critical"       : False,

        "vitals" : [
            {
                "recorded_at"   : (today - timedelta(hours=4)).strftime("%Y-%m-%d %H:%M"),
                "blood_pressure": "122/80",
                "pulse_bpm"     : 70,
                "temperature_f" : 98.4,
                "spo2_pct"      : 99,
                "weight_kg"     : 81.0,
            },
        ],

        "prescriptions" : [
            {
                "prescribed_date" : today.strftime("%Y-%m-%d"),
                "doctor_name"     : "Dr. Karthik Menon",
                "medications" : [
                    { "name": "Pantoprazole",    "dose": "40mg",  "frequency": "Once daily",  "duration": "7 days",  "instructions": "Before food"  },
                    { "name": "Tramadol",        "dose": "50mg",  "frequency": "Thrice daily","duration": "5 days",  "instructions": "After food"   },
                    { "name": "Cefuroxime",      "dose": "500mg", "frequency": "Twice daily", "duration": "7 days",  "instructions": "With water"   },
                    { "name": "Enoxaparin",      "dose": "40mg",  "frequency": "Once daily",  "duration": "10 days", "instructions": "Subcutaneous" },
                ],
                "notes" : "Physiotherapy twice daily. Knee elevation recommended.",
            },
        ],

        "lab_reports" : [
            {
                "report_id"     : "LAB-2024-3988",
                "test_name"     : "Pre-operative Blood Work",
                "ordered_by"    : "Dr. Karthik Menon",
                "ordered_date"  : (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                "result_date"   : (today - timedelta(days=4)).strftime("%Y-%m-%d"),
                "status"        : "completed",
                "results" : [
                    { "parameter": "Haemoglobin",   "value": "14.8", "unit": "g/dL",    "reference": "13.0-17.0", "flag": "normal" },
                    { "parameter": "Blood Glucose", "value": "96",   "unit": "mg/dL",   "reference": "70-110",    "flag": "normal" },
                    { "parameter": "Creatinine",    "value": "0.9",  "unit": "mg/dL",   "reference": "0.7-1.3",   "flag": "normal" },
                    { "parameter": "PT/INR",        "value": "1.1",  "unit": "ratio",   "reference": "0.8-1.2",   "flag": "normal" },
                ],
            },
        ],

        "bill_estimate" : {
            "room_charges_lakh"     : 0.60,
            "doctor_fees_lakh"      : 0.80,
            "pharmacy_lakh"         : 0.35,
            "lab_charges_lakh"      : 0.15,
            "procedure_charges_lakh": 3.20,
            "total_lakh"            : 5.10,
            "insurance_covered_lakh": 4.00,
            "patient_due_lakh"      : 1.10,
            "insurance_provider"    : "HDFC Ergo Health",
            "claim_status"          : "approved",
        },

        "discharge_checklist" : [
            { "task": "Final vitals recorded",           "completed": False },
            { "task": "Discharge summary prepared",      "completed": False },
            { "task": "Prescriptions printed",           "completed": False },
            { "task": "Insurance claim processed",       "completed": True  },
            { "task": "Follow-up appointment scheduled", "completed": False },
            { "task": "Physiotherapy plan handed over",  "completed": False },
        ],
    },
]