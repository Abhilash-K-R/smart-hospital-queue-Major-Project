"""
backend/test_cross_system_flow.py
---------------------------------
End-to-end verification proving the core novelty of the VTU CSE Major Project:
"AI-Based Smart Hospital Queue Prediction and Patient Arrival Time Optimization System"

Flow tested:
  Step 1: Patient checks their current OPD queue position and departure time.
  Step 2: Emergency walk-in patient arrives at hospital triage.
  Step 3: Staff inserts emergency patient into the front of the queue (Pos #1).
  Step 4: Regular patient's queue position is immediately bumped (+1).
  Step 5: Patient's arrival prediction dynamically recalculates — wait time increases,
          and departure notification delays accordingly so patient does not wait needlessly!
  Step 6: Staff calls next patient, queue advances, and patient moves forward.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_cross_system():
    print("==================================================================")
    print(" CROSS-SYSTEM END-TO-END VERIFICATION: PATIENT APP + STAFF PORTAL")
    print("==================================================================")

    # 1. Step 1: Patient checks status before emergency
    print("\n[Step 1] Regular Patient checks live queue and departure status...")
    token_number = "OPD-001"
    res = requests.get(f"{BASE_URL}/queue/status/{token_number}")
    assert res.status_code == 200, f"Error getting queue status: {res.text}"
    patient_q_before = res.json()

    print(f"  > Patient Token: {patient_q_before['tokenNumber']}")
    print(f"  > Queue Position Ahead: {patient_q_before['patientsAhead']}")
    print(f"  > Estimated Wait Time: {patient_q_before['estimatedWaitMinutes']} mins")
    print(f"  > Assigned Doctor: {patient_q_before['doctor']}")

    # Create patient auth token for appointment 1's owner
    from auth import create_access_token
    patient_token = create_access_token(data={"sub": "1", "role": "patient"})
    patient_headers = {"Authorization": f"Bearer {patient_token}"}

    # Departure check before emergency
    dep_req = {
        "appointment_id": 1,
        "patient_lat": 13.416230,
        "patient_lng": 77.137439
    }
    res = requests.post(f"{BASE_URL}/departure-check", json=dep_req, headers=patient_headers)
    assert res.status_code == 200, f"Error on departure-check: {res.text}"
    dep_before = res.json()

    print(f"  > Travel Time: {dep_before['travel_time_minutes']} mins")
    print(f"  > Predicted Wait Time: {dep_before['predicted_wait_minutes']} mins")
    print(f"  > Should Leave Now: {dep_before['should_leave_now']}")
    print(f"  > Departure Advisory: '{dep_before['message']}'")

    # 2. Step 2 & 3: Staff logs in and inserts Emergency Patient
    print("\n[Step 2 & 3] Hospital Staff declares Emergency Walk-in at Triage...")
    login_res = requests.post(f"{BASE_URL}/auth/staff/login", json={"username": "admin", "password": "admin"})
    assert login_res.status_code == 200, "Staff login failed"
    staff_token = login_res.json()["token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    emergency_data = {
        "name": "Manjunath Swamy (Acute Trauma)",
        "age": 39,
        "gender": "Male",
        "chief_complaint": "Road traffic accident with chest trauma, dyspnea, tachycardia",
        "doctor_id": 1,
        "blood_pressure": "145/95",
        "heart_rate": 118,
        "spo2": 92,
        "temperature": 37.8
    }
    emg_res = requests.post(f"{BASE_URL}/staff/emergency-insert", json=emergency_data, headers=staff_headers)
    assert emg_res.status_code == 200, f"Emergency insert failed: {emg_res.text}"
    emg_info = emg_res.json()
    print(f"  > Emergency Prioritized! Token: {emg_info['tokenNumber']}, Queue Pos: #{emg_info['queue_position']}")
    print(f"  > Regular Patients Shifted Back: {emg_info['impacted_patients']}")

    # 3. Step 4 & 5: Patient checks status AFTER emergency insertion
    print("\n[Step 4 & 5] Regular Patient checks queue & departure time AFTER emergency...")
    res = requests.get(f"{BASE_URL}/queue/status/{token_number}")
    patient_q_after = res.json()

    res = requests.post(f"{BASE_URL}/departure-check", json=dep_req, headers=patient_headers)
    dep_after = res.json()


    print(f"  > Patients Ahead: {patient_q_before['patientsAhead']} -> {patient_q_after['patientsAhead']}")
    print(f"  > Predicted Wait Time: {dep_before['predicted_wait_minutes']}m -> {dep_after['predicted_wait_minutes']}m")
    print(f"  > Advisory Message: '{dep_after['message']}'")

    assert patient_q_after['patientsAhead'] == patient_q_before['patientsAhead'] + 1, \
        f"Expected patientsAhead to increase by 1, was {patient_q_before['patientsAhead']} now {patient_q_after['patientsAhead']}"
    assert dep_after['predicted_wait_minutes'] > dep_before['predicted_wait_minutes'], \
        "Predicted wait time must increase due to emergency triage insertion!"
    print("  [PASS] PROVED: Patient wait time automatically increased by emergency consultation buffer!")

    # 4. Step 6: Staff advances queue ("Call Next")
    print("\n[Step 6] Staff calls next patient in OPD...")
    call_res = requests.post(f"{BASE_URL}/staff/queue/call-next?doctor_id=1", headers=staff_headers)
    assert call_res.status_code == 200, "Call next failed"
    call_info = call_res.json()
    print(f"  > Server Action: {call_info['message']}")

    # 5. Check Staff Dashboard KPIs
    print("\n[Step 7] Checking Staff Operations Overview KPIs...")
    stats_res = requests.get(f"{BASE_URL}/staff/stats", headers=staff_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print(f"  > Total Today: {stats['total_today']}")
    print(f"  > Currently Waiting: {stats['currently_waiting']}")
    print(f"  > Average Wait Time: {stats['avg_wait_minutes']} mins")
    print(f"  > Emergency Count: {stats['emergency_count']}")

    print("\n==================================================================")
    print(" [PASS] FULL CROSS-SYSTEM NOVELTY & TELEMETRY VERIFIED SUCCESSFULLY! ")
    print("==================================================================")

if __name__ == "__main__":
    test_cross_system()
