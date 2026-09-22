"""
backend/tests/test_walkin_and_doctor_room.py
--------------------------------------------
Automated verification for Phase 8 features:
1. POST /staff/walkin-register (Offline Counter Token Allocation & Thermal Receipt Data)
2. GET  /staff/doctor/{id}/consultation (Doctor Consultation Room Telemetry & Queue Stream)
3. Call Next & Consultation Complete Lifecycle
"""

import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_walkin_and_doctor_portal():
    print("\n========================================================")
    print("STARTING TEST: OFFLINE WALKIN & DOCTOR CONSULTATION ROOM")
    print("========================================================")

    test_phone = f"98{uuid.uuid4().int % 100000000:08d}"
    patient_name = "Manjunath S. Gowda"

    # 1. Test Walk-in Registration
    print(f"\n[1] Registering offline walk-in patient ({patient_name}, phone: {test_phone})...")
    walkin_payload = {
        "patient_name": patient_name,
        "phone": test_phone,
        "age": 48,
        "gender": "Male",
        "doctor_id": 3,
        "doctor_name": "Dr. Rajeswari R.",
        "department": "General Medicine",
        "time_slot": "11:30 AM",
        "symptoms": "Seasonal viral fever with joint chills"
    }

    res = requests.post(f"{BASE_URL}/staff/walkin-register", json=walkin_payload)
    assert res.status_code == 200, f"Walk-in registration failed: {res.text}"
    data = res.json()

    assert data["success"] is True
    assert data["tokenNumber"].startswith("OPD-")
    assert data["doctor"] == "Dr. Rajeswari R."
    assert data["roomNo"] == "Room 204"
    assert data["time_slot"] == "11:30 AM"
    assert data["queue_position"] >= 1

    appt_id = data["appointment_id"]
    token_str = data["tokenNumber"]
    print(f"[PASS] Walk-in registered successfully: Token {token_str} (Appt #{appt_id}) for {data['roomNo']}")

    # 2. Test Doctor Room Telemetry
    print(f"\n[2] Fetching Doctor Consultation Room stream for Doctor #3 ({data['doctor']})...")
    room_res = requests.get(f"{BASE_URL}/staff/doctor/3/consultation")
    assert room_res.status_code == 200, f"Doctor room fetch failed: {room_res.text}"
    room_data = room_res.json()

    assert room_data["doctor_name"] == "Dr. Rajeswari R."
    assert room_data["roomNo"] == "Room 204"
    assert room_data["total_waiting"] >= 1
    print(f"[PASS] Doctor Room telemetry verified: {room_data['total_waiting']} patient(s) waiting in queue")

    # 3. Call Next Patient from Doctor Room
    print("\n[3] Calling Next Patient in Doctor Room...")
    call_res = requests.post(f"{BASE_URL}/staff/queue/call-next")
    assert call_res.status_code == 200, f"Call next failed: {call_res.text}"
    call_data = call_res.json()
    print(f"[PASS] Call Next executed: {call_data.get('message', 'Patient called')}")

    # 4. Mark Consultation Complete
    print(f"\n[4] Marking Consultation Complete for Appt #{appt_id}...")
    comp_res = requests.put(f"{BASE_URL}/staff/appointments/{appt_id}/status", json={
        "appointment_id": appt_id,
        "action": "completed"
    })
    assert comp_res.status_code == 200, f"Complete status failed: {comp_res.text}"
    print(f"[PASS] Appt #{appt_id} marked as completed")

    print("\n========================================================")
    print("ALL WALKIN & DOCTOR PORTAL TESTS PASSED! (100% OK)")
    print("========================================================\n")


if __name__ == "__main__":
    test_walkin_and_doctor_portal()
