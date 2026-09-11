"""
backend/test_phase7_integration.py
-----------------------------------
Comprehensive End-to-End Integration & Hospital Disruption Test Suite for Phase 7.

Validates the complete patient and hospital operational lifecycle:
  1. Patient Registration & Initial Departure Check
  2. Emergency Priority Triage Insertion & Dynamic Queue Bumping
  3. Doctor Operational Disruption (+20m delay buffer propagation)
  4. Live Queue Status & Multi-patient Queue Advancement
  5. Post-Consultation Audit Logging (QueueLog table in Neon PostgreSQL)
  6. Edge-Case Resilience (unknown tokens, empty queue call, status reset)

Author: Abhilash K R (Lead & ML/Backend)
Project: AI-Based Smart Hospital Queue Prediction Major Project (VTU / SIET)
"""

import sys
import os
import time
import requests

BASE_URL = "http://localhost:8000"

def log(step: str, detail: str = ""):
    print(f"\n[PHASE 7 TEST] === {step} ===")
    if detail:
        print(f"               {detail}")

def assert_true(condition: bool, message: str):
    if not condition:
        print(f"[FAIL] Assertion Failed: {message}")
        sys.exit(1)
    else:
        print(f"  [PASS] {message}")


def main():
    print("=" * 70)
    print("SMART HOSPITAL QUEUE SYSTEM — PHASE 7 INTEGRATION TEST SUITE")
    print(f"Target Backend: {BASE_URL}")
    print("=" * 70)

    # 0. Health Check
    log("0. API Health Check", f"GET {BASE_URL}/")
    resp = requests.get(f"{BASE_URL}/")
    assert_true(resp.status_code == 200, f"Backend is live (status {resp.status_code})")
    print(f"  Backend response: {resp.json()}")

    # 1. Patient Lifecycle — Register & Initial Departure Check
    ts = int(time.time())
    email = f"e2e_pat_{ts}@test.local"
    phone = f"99{ts % 100000000:08d}"
    log("1. Patient Registration & Auto-Booking", f"POST /patients/register with {email}")
    reg_payload = {
        "fullName": f"E2E Test Patient {ts}",
        "email": email,
        "phone": phone,
        "password": "Password@123"
    }
    reg_res = requests.post(f"{BASE_URL}/patients/register", json=reg_payload)
    assert_true(reg_res.status_code == 200, f"Registration successful (status {reg_res.status_code})")
    reg_data = reg_res.json()
    token = reg_data["token"]
    patient_id = reg_data["patient"]["id"]
    appt_id = reg_data["patient"]["appointment_id"]
    token_num = reg_data["patient"]["tokenNumber"]
    initial_ahead = reg_data["patient"]["patientsAhead"]
    print(f"  Created Patient ID: {patient_id}, Appointment ID: {appt_id}, Token: {token_num}, Patients Ahead: {initial_ahead}")

    auth_headers = {"Authorization": f"Bearer {token}"}

    # Query initial departure check
    log("1.1 Initial Departure Check", "POST /departure-check")
    # Tumakuru residential area coords (~4 km from hospital)
    home_lat = 13.340000
    home_lng = 77.100000
    dep_payload = {
        "appointment_id": appt_id,
        "patient_lat": home_lat,
        "patient_lng": home_lng,
    }
    dep_res = requests.post(f"{BASE_URL}/departure-check", json=dep_payload, headers=auth_headers)
    assert_true(dep_res.status_code == 200, f"Departure check returned 200: {dep_res.status_code}")
    dep_data = dep_res.json()
    initial_wait = dep_data["predicted_wait_minutes"]
    travel_time = dep_data["travel_time_minutes"]
    print(f"  Predicted Wait: {initial_wait}m | Travel Time: {travel_time}m | Leave Now: {dep_data['should_leave_now']}")
    print(f"  Message: {dep_data['message']}")
    assert_true(initial_wait > 0, "Initial predicted wait > 0")
    assert_true(travel_time > 0, "Travel time > 0")

    # 2. Emergency Priority Triage Insertion
    log("2. Emergency Priority Disruption", "POST /staff/emergency-insert")
    emg_payload = {
        "name": f"Trauma Acute Case {ts}",
        "age": 52,
        "gender": "Male",
        "chief_complaint": "Acute STEMI myocardial infarction with severe chest pain",
        "doctor_id": 1,
        "blood_pressure": "165/105",
        "heart_rate": 118,
        "spo2": 91,
        "temperature": 37.4,
    }
    emg_res = requests.post(f"{BASE_URL}/staff/emergency-insert", json=emg_payload)
    assert_true(emg_res.status_code == 200, f"Emergency inserted successfully (status {emg_res.status_code})")
    emg_data = emg_res.json()
    emg_appt_id = emg_data["appointment_id"]
    emg_token = emg_data["tokenNumber"]
    print(f"  Emergency Appt ID: {emg_appt_id}, Token: {emg_token}, Position: {emg_data['queue_position']}")
    assert_true(emg_data["queue_position"] == 1, "Emergency patient placed at Position 1")

    log("2.1 Verify Dynamic Queue Bumping on Regular Patient", f"GET /queue/status/{token_num}")
    q_res = requests.get(f"{BASE_URL}/queue/status/{token_num}", headers=auth_headers)
    assert_true(q_res.status_code == 200, "Queue status fetched successfully")
    q_data = q_res.json()
    new_ahead = q_data["patientsAhead"]
    print(f"  Regular Patient Patients Ahead: was {initial_ahead} -> now bumped to {new_ahead}")
    assert_true(new_ahead == initial_ahead + 1, f"Patients ahead increased by +1 ({initial_ahead} -> {new_ahead})")

    # Verify regular patient's departure check wait time increased
    log("2.2 Verify ML Wait-Time Recalculation after Emergency", "POST /departure-check")
    dep_res2 = requests.post(f"{BASE_URL}/departure-check", json=dep_payload, headers=auth_headers)
    assert_true(dep_res2.status_code == 200, "Second departure check successful")
    post_emg_wait = dep_res2.json()["predicted_wait_minutes"]
    print(f"  Wait time: was {initial_wait}m -> now {post_emg_wait}m")
    assert_true(post_emg_wait >= initial_wait, "Wait time stayed equal or increased after emergency triage insertion")

    # 3. Doctor Delay Operational Disruption (+20 min)
    log("3. Doctor Operational Disruption (+20 min buffer)", "PUT /staff/doctors/1/status")
    doc_payload = {
        "status": "Delayed",
        "delay_minutes": 20,
        "avg_consult_minutes": 15
    }
    doc_res = requests.put(f"{BASE_URL}/staff/doctors/1/status", json=doc_payload)
    assert_true(doc_res.status_code == 200, f"Doctor status updated to Delayed (status {doc_res.status_code})")
    doc_data = doc_res.json()
    print(f"  Doctor 1 Status: {doc_data['status']}, Delay Buffer: {doc_data['delay_minutes']}m")
    assert_true(doc_data["delay_minutes"] == 20, "Delay buffer recorded as 20 min")

    # Verify GET /staff/doctors reflects delay
    log("3.1 Verify Staff Doctors List reflects Delay", "GET /staff/doctors")
    docs_list = requests.get(f"{BASE_URL}/staff/doctors").json()
    doc1 = next((d for d in docs_list if d["id"] == 1), None)
    assert_true(doc1 is not None and doc1["status"] == "Delayed", "Doctor 1 listed as Delayed in /staff/doctors")
    assert_true(doc1["delay_minutes"] == 20, "Doctor 1 delay_minutes == 20 in /staff/doctors")

    # Verify patient's departure check absorbs the +20 min delay buffer
    log("3.2 Verify Patient Departure Check incorporates Doctor Delay", "POST /departure-check")
    dep_res3 = requests.post(f"{BASE_URL}/departure-check", json=dep_payload, headers=auth_headers)
    post_delay_wait = dep_res3.json()["predicted_wait_minutes"]
    print(f"  Wait time with Doctor Delay: {post_delay_wait}m (expected ~{post_emg_wait + 20}m)")
    assert_true(post_delay_wait >= post_emg_wait + 18, "Doctor delay buffer (+20m) accurately reflected in patient predicted wait")

    # 4. Queue Advancement & Consultation Flow
    log("4. Queue Advancement — Advance Emergency to Serving", f"PUT /staff/appointments/{emg_appt_id}/status")
    adv_emg = requests.put(
        f"{BASE_URL}/staff/appointments/{emg_appt_id}/status",
        json={"action": "serving", "appointment_id": emg_appt_id}
    )
    assert_true(adv_emg.status_code == 200, f"Emergency marked as serving (status {adv_emg.status_code})")
    time.sleep(0.5)

    log("4.1 Complete Emergency Consultation & Log Audit Row", f"PUT /staff/appointments/{emg_appt_id}/status")
    comp_emg = requests.put(
        f"{BASE_URL}/staff/appointments/{emg_appt_id}/status",
        json={"action": "completed", "appointment_id": emg_appt_id}
    )
    assert_true(comp_emg.status_code == 200, f"Emergency marked as completed (status {comp_emg.status_code})")
    time.sleep(0.5)

    # Regular patient enters consultation
    log("4.2 Regular Patient enters Consultation", f"PUT /staff/appointments/{appt_id}/status")
    adv_pat = requests.put(
        f"{BASE_URL}/staff/appointments/{appt_id}/status",
        json={"action": "serving", "appointment_id": appt_id}
    )
    assert_true(adv_pat.status_code == 200, "Regular patient marked as serving")
    time.sleep(0.5)

    log("4.3 Regular Patient Consultation Completed", f"PUT /staff/appointments/{appt_id}/status")
    comp_pat = requests.put(
        f"{BASE_URL}/staff/appointments/{appt_id}/status",
        json={"action": "completed", "appointment_id": appt_id}
    )
    assert_true(comp_pat.status_code == 200, "Regular patient marked as completed")
    time.sleep(0.5)

    # 5. Post-Consultation Audit Logging (QueueLog in Neon)
    log("5. Post-Consultation Model Evaluation Logs", "GET /staff/queue-logs")
    log_res = requests.get(f"{BASE_URL}/staff/queue-logs?limit=10")
    assert_true(log_res.status_code == 200, f"Queue logs fetched successfully (status {log_res.status_code})")
    log_data = log_res.json()
    print(f"  Total Consultation Logs Recorded: {log_data['total']}")
    print(f"  Avg Predicted Wait: {log_data['avg_predicted_wait']}m | Avg Actual Wait: {log_data['avg_actual_wait']}m")
    assert_true(log_data["total"] > 0, "QueueLog records exist in Neon PostgreSQL")

    # Check that our completed appointment is in the logs
    recent_appt_ids = [l["appointment_id"] for l in log_data["logs"]]
    print(f"  Recent Logged Appointment IDs: {recent_appt_ids}")
    assert_true(appt_id in recent_appt_ids or emg_appt_id in recent_appt_ids, "E2E completed appointment logged in QueueLog")

    # 6. Edge-Case Resilience Testing
    log("6. Edge-Case Resilience Testing")
    
    # 6.1 Call next on empty or remaining queue
    log("6.1 Call Next Patient (Queue Drain)", "POST /staff/queue/call-next")
    call_res = requests.post(f"{BASE_URL}/staff/queue/call-next?doctor_id=1")
    assert_true(call_res.status_code == 200, f"Call next handled gracefully (status {call_res.status_code})")
    print(f"  Call next result: {call_res.json()['message']}")

    # 6.2 Unknown token / appointment lookup
    log("6.2 Unknown Token Lookup", "GET /queue/status/OPD-999999")
    unknown_res = requests.get(f"{BASE_URL}/queue/status/OPD-999999")
    assert_true(unknown_res.status_code in [200, 404], f"Unknown token handled safely without crash (status {unknown_res.status_code})")

    # 6.3 Reset doctor delay back to Active
    log("6.3 Reset Doctor Status to Active", "PUT /staff/doctors/1/status")
    reset_res = requests.put(f"{BASE_URL}/staff/doctors/1/status", json={"status": "Active", "delay_minutes": 0})
    assert_true(reset_res.status_code == 200, "Doctor 1 reset to Active (0 delay)")
    print(f"  Doctor 1 Status: {reset_res.json()['status']}, Delay: {reset_res.json()['delay_minutes']}m")

    # 7. Final Verification Summary
    print("\n" + "=" * 70)
    print("PHASE 7 INTEGRATION & DISRUPTION TESTING: ALL ASSERTIONS PASSED! [100% OK]")
    print("=" * 70)


if __name__ == "__main__":
    main()
