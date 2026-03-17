"""Quick smoke test for Phase A DB consolidation."""
import requests

base = "http://127.0.0.1:8001/api"

# Test 1: patients list
r = requests.get(f"{base}/patients/")
data = r.json()
print(f"Patients: {data.get('count',0)} patients returned")
if data.get("patients"):
    p = data["patients"][0]
    print(f"  First: {p['name']} ({p['patient_id']}), dept={p.get('department_id')}, vitals={len(p.get('vitals',[]))} entries")

# Test 2: single patient
r2 = requests.get(f"{base}/patients/APL-2024-0847")
p2 = r2.json()
print(f"Single patient: {p2.get('name','ERROR')}, vitals={len(p2.get('vitals',[]))}, prescriptions={len(p2.get('prescriptions',[]))}, bill_total={p2.get('bill_estimate',{}).get('total_lakh','MISSING')}")
print(f"  lab_reports={len(p2.get('lab_reports',[]))}, discharge_checklist={len(p2.get('discharge_checklist',[]))}")

# Test 3: analytics summary
r3 = requests.get(f"{base}/analytics/summary")
d3 = r3.json()
print(f"Analytics: health_score={d3.get('health_score',{}).get('score','MISSING')}, depts={d3.get('aggregates',{}).get('departments_count',0)}")

# Test 4: patients-mgmt list
r4 = requests.get(f"{base}/patients-mgmt/")
d4 = r4.json()
print(f"PatientsMgmt: {d4.get('total',0)} patients (should match workflow)")

# Test 5: workflow patients  
r5 = requests.get(f"{base}/workflow/patients")
d5 = r5.json()
print(f"Workflow: {len(d5.get('patients',[]))} patients")

# Test 6: dashboard admin
r6 = requests.get(f"{base}/dashboard/admin", headers={"X-Role": "admin"})
d6 = r6.json()
print(f"AdminDashboard: health_score={d6.get('health_score',{}).get('score','MISSING')}, anomalies={len(d6.get('anomaly_alerts',[]))}")

# Validation
pass_count = 0
total = 5
if data.get("count", 0) >= 10:
    pass_count += 1
    print("[PASS] Patients list returns >= 10 patients")
else:
    print(f"[FAIL] Patients list returns {data.get('count',0)}, expected >= 10")

if p2.get("name") == "Senthil Kumar":
    pass_count += 1
    print("[PASS] Single patient lookup works")
else:
    print(f"[FAIL] Single patient name: {p2.get('name')}")

if d3.get("health_score", {}).get("score", 0) > 0:
    pass_count += 1
    print("[PASS] Analytics pipeline works")
else:
    print(f"[FAIL] Health score: {d3.get('health_score')}")

if d4.get("total", 0) >= 10:
    pass_count += 1
    print("[PASS] PatientsMgmt uses WorkflowPatient")
else:
    print(f"[FAIL] PatientsMgmt total: {d4.get('total',0)}")

if len(d5.get("patients", [])) >= 10:
    pass_count += 1
    print("[PASS] Workflow patients present")
else:
    print(f"[FAIL] Workflow patients: {len(d5.get('patients',[]))}")

print(f"\n{'='*40}")
print(f"Results: {pass_count}/{total} tests passed")
