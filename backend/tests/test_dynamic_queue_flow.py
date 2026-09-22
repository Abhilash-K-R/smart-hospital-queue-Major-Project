"""
backend/test_dynamic_queue_flow.py
-----------------------------------
Automated test suite verifying dynamic queue behavior:
1. Zero fake seeded appointments by default (clean empty queues).
2. Unbooked patient login returns null token and null appointment.
3. Live queue stream for Dr. Rajeswari and Dr. Priya Sharma starts empty.
4. Booking an appointment with Dr. Rajeswari dynamically updates her live queue.
5. Staff calling next patient immediately updates the live serving token.
"""

import sys
import requests

BASE_URL = "http://localhost:8000"


def run_test():
    print("=" * 60)
    print("STARTING DYNAMIC QUEUE & REAL-TIME SYNC TEST SUITE")
    print("=" * 60)

    # 1. Clean database state
    from purge_dummy_appointments import purge_and_reset
    purge_and_reset()

    # 2. Check Doctor 3 (Dr. Rajeswari) and Doctor 1 (Dr. Priya Sharma) live streams
    print("\n[1] Checking live queue stream for Dr. Rajeswari R. (Doc ID 3)...")
    res = requests.get(f"{BASE_URL}/queue/doctor/3")
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    assert data["doctor"] == "Dr. Rajeswari R.", f"Expected Dr. Rajeswari R., got {data['doctor']}"
    assert data["department"] == "General Medicine"
    assert data["roomNo"] == "Room 204"
    assert data["patientsInQueue"] == 0, f"Expected 0 in queue, got {data['patientsInQueue']}"
    assert data["servingToken"] is None, f"Expected None serving token, got {data['servingToken']}"
    assert len(data["queue"]) == 0, f"Expected empty queue list, got {data['queue']}"
    print("[PASS] Dr. Rajeswari R. queue is cleanly empty (0 patients)")

    print("\n[2] Checking live queue stream for Dr. Priya Sharma (Doc ID 1)...")
    res = requests.get(f"{BASE_URL}/queue/doctor/1")
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    assert data["doctor"] == "Dr. Priya Sharma"
    assert data["department"] == "Cardiology"
    assert data["roomNo"] == "Room 302"
    assert data["patientsInQueue"] == 0
    print("[PASS] Dr. Priya Sharma queue is cleanly empty (0 patients)")

    # 3. Register and login unbooked user
    phone = "9845012345"
    print(f"\n[3] Registering and logging in new patient ({phone})...")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Arun Kumar",
        "phone": phone,
        "password": "Password@123"
    })
    assert reg_res.status_code == 201, f"Reg failed: {reg_res.text}"

    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "emailOrPhone": phone,
        "password": "Password@123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    login_data = login_res.json()
    user = login_data["user"]
    token = login_data["token"]
    assert user["tokenNumber"] is None, f"Expected null tokenNumber for unbooked user, got {user['tokenNumber']}"
    assert user["appointment_id"] is None, f"Expected null appointment_id, got {user['appointment_id']}"
    print("[PASS] Unbooked patient login has zero fake tokens (tokenNumber=None, appointment_id=None)")

    # 4. Check /appointments/me for unbooked user
    headers = {"Authorization": f"Bearer {token}"}
    me_res = requests.get(f"{BASE_URL}/appointments/me", headers=headers)
    assert me_res.status_code == 200
    assert len(me_res.json()) == 0, f"Expected 0 appointments, got {me_res.json()}"
    print("[PASS] /appointments/me correctly returns empty list for unbooked patient")

    # 5. Book appointment with Dr. Rajeswari R. (General Medicine)
    print("\n[4] Booking appointment with Dr. Rajeswari R. (General Medicine)...")
    book_res = requests.post(f"{BASE_URL}/patients/book", headers=headers, json={
        "doctor": "Dr. Rajeswari R.",
        "doctor_id": 3,
        "department": "General Medicine",
        "date": "2026-09-21",
        "timeSlot": "10:30 AM",
        "symptoms": "Fever & body ache",
        "patient_name": "Arun Kumar",
        "phone": phone
    })
    assert book_res.status_code == 200, f"Booking failed: {book_res.text}"
    book_data = book_res.json()
    appt_id = book_data["appointment_id"]
    token_str = book_data["tokenNumber"]
    print(f"[PASS] Appointment booked! Token: {token_str}, Doctor: {book_data['doctor']}, Room: {book_data['roomNo']}")

    # 6. Verify live queue status for the newly booked token
    print(f"\n[5] Fetching live queue status for {token_str}...")
    q_res = requests.get(f"{BASE_URL}/queue/status/{appt_id}")
    assert q_res.status_code == 200, f"Queue status failed: {q_res.text}"
    q_data = q_res.json()
    assert q_data["doctor"] == "Dr. Rajeswari R.", f"Expected Dr. Rajeswari R., got {q_data['doctor']}"
    assert q_data["department"] == "General Medicine"
    assert q_data["roomNo"] == "Room 204"
    assert q_data["patientsAhead"] == 0
    print(f"[PASS] Queue status correctly binds to {q_data['doctor']} ({q_data['department']}) in {q_data['roomNo']}")

    # 7. Check Dr. Rajeswari's stream now shows 1 patient
    stream_res = requests.get(f"{BASE_URL}/queue/doctor/3")
    stream_data = stream_res.json()
    assert stream_data["patientsInQueue"] == 1, f"Expected 1 patient in queue, got {stream_data['patientsInQueue']}"
    assert len(stream_data["queue"]) == 1
    assert stream_data["queue"][0]["tokenNumber"] == token_str
    print(f"[PASS] Dr. Rajeswari R. live stream updated: 1 patient ({token_str}) in queue")

    # 8. Check Cardiology stream is still 0 (isolated doctor queues)
    cardio_res = requests.get(f"{BASE_URL}/queue/doctor/1")
    assert cardio_res.json()["patientsInQueue"] == 0
    print("[PASS] Dr. Priya Sharma (Cardiology) queue remains 0 (Doctor-isolated queues verified)")

    # 9. Staff calls next patient
    print("\n[6] Staff calls next patient on desk...")
    call_res = requests.post(f"{BASE_URL}/staff/queue/call-next")
    assert call_res.status_code == 200
    
    # 10. Re-check Dr. Rajeswari's stream for live Serving update
    stream_res2 = requests.get(f"{BASE_URL}/queue/doctor/3")
    stream_data2 = stream_res2.json()
    assert stream_data2["servingToken"] == token_str, f"Expected servingToken {token_str}, got {stream_data2['servingToken']}"
    assert stream_data2["queue"][0]["status"] == "serving"
    print(f"[PASS] Staff action instantly synced! Token {token_str} is now SERVING on Dr. Rajeswari's desk")

    print("\n" + "=" * 60)
    print("ALL DYNAMIC QUEUE & REAL-TIME SYNC TESTS PASSED! (100% OK)")
    print("=" * 60)


if __name__ == "__main__":
    run_test()
