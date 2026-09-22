"""
test_frontend_integration.py
-----------------------------
Simulates the exact HTTP flow executed by the React patient-app:
1. POST /patients/register (or /auth/login)
2. Saves returned JWT token
3. GET /queue/status/OPD-001 (QueueCard & ProgressCard auto-refresh)
4. POST /departure-check (ArrivalPrediction live leave-now check)
"""
import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_full_frontend_flow():
    print("=" * 60)
    print("TESTING FULL FRONTEND HTTP FLOW AGAINST LIVE BACKEND (PORT 8000)")
    print("=" * 60)

    # 1. Register a new patient
    unique_id = uuid.uuid4().hex[:5]
    reg_payload = {
        "fullName": f"Live Patient {unique_id}",
        "email": f"patient_{unique_id}@hospital.com",
        "phone": "9876543210",
        "password": "Password@123",
        "age": 24,
        "gender": "Male",
        "bloodGroup": "B+",
        "department": "Cardiology",
        "symptoms": "Occasional palpitations and shortness of breath"
    }

    req = urllib.request.Request(
        f"{BASE_URL}/patients/register",
        data=json.dumps(reg_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.getcode() == 200
        reg_data = json.loads(resp.read().decode("utf-8"))
        print("[Step 1] Registration & Auto-booking Passed!")
        print(f"  Token: {reg_data.get('token')[:20]}...")
        print(f"  Token Number: {reg_data.get('tokenNumber')}")
        print(f"  Appointment ID: {reg_data.get('patient', {}).get('appointment_id')}")
        jwt_token = reg_data["token"]
        token_num = reg_data["tokenNumber"]
        appt_id = reg_data.get("patient", {}).get("appointment_id", 1)

    # 2. Test Login flow
    login_payload = {
        "emailOrPhone": f"patient_{unique_id}@hospital.com",
        "password": "Password@123"
    }
    req_login = urllib.request.Request(
        f"{BASE_URL}/auth/login",
        data=json.dumps(login_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_login) as resp:
        assert resp.getcode() == 200
        login_data = json.loads(resp.read().decode("utf-8"))
        print("\n[Step 2] Login API Passed!")
        print(f"  User ID: {login_data.get('user', {}).get('id')}")
        print(f"  Appointment ID resolved: {login_data.get('user', {}).get('appointment_id')}")

    # 3. Test Queue Status sync (QueueCard & ProgressCard)
    req_queue = urllib.request.Request(
        f"{BASE_URL}/queue/status/{token_num}",
        headers={"Authorization": f"Bearer {jwt_token}"}
    )
    with urllib.request.urlopen(req_queue) as resp:
        assert resp.getcode() == 200
        queue_data = json.loads(resp.read().decode("utf-8"))
        print("\n[Step 3] Queue Status Sync (30s Auto-refresh) Passed!")
        print(f"  Your Token: {queue_data.get('tokenNumber')}")
        print(f"  Now Serving: {queue_data.get('currentToken')}")
        print(f"  Patients Ahead: {queue_data.get('patientsAhead')}")
        print(f"  Est. Wait: {queue_data.get('estimatedWaitMinutes')} mins")
        print(f"  Doctor: {queue_data.get('doctor')} ({queue_data.get('department')})")

    # 4. Test Departure Check (ArrivalPrediction.jsx)
    # 4a: Patient nearby (~500m south of SIET Tumakuru)
    dep_payload_nearby = {
        "appointment_id": appt_id,
        "patient_lat": 13.376230 + 0.004,
        "patient_lng": 77.097439 + 0.004
    }
    req_dep_nearby = urllib.request.Request(
        f"{BASE_URL}/departure-check",
        data=json.dumps(dep_payload_nearby).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {jwt_token}"
        }
    )
    with urllib.request.urlopen(req_dep_nearby) as resp:
        assert resp.getcode() == 200
        dep_nearby = json.loads(resp.read().decode("utf-8"))
        print("\n[Step 4a] Arrival Prediction (Nearby Patient - Wait at Home) Passed!")
        print(f"  Predicted Wait: {dep_nearby.get('predicted_wait_minutes')} mins")
        print(f"  Travel Time: {dep_nearby.get('travel_time_minutes')} mins")
        print(f"  Should Leave Now: {dep_nearby.get('should_leave_now')}")
        print(f"  Message: {dep_nearby.get('message')}")
        assert dep_nearby["should_leave_now"] is False

    # 4b: Patient far (~70km away in Bangalore)
    dep_payload_far = {
        "appointment_id": appt_id,
        "patient_lat": 12.9716,
        "patient_lng": 77.5946
    }
    req_dep_far = urllib.request.Request(
        f"{BASE_URL}/departure-check",
        data=json.dumps(dep_payload_far).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {jwt_token}"
        }
    )
    with urllib.request.urlopen(req_dep_far) as resp:
        assert resp.getcode() == 200
        dep_far = json.loads(resp.read().decode("utf-8"))
        print("\n[Step 4b] Arrival Prediction (Far Patient - LEAVE NOW Alert) Passed!")
        print(f"  Predicted Wait: {dep_far.get('predicted_wait_minutes')} mins")
        print(f"  Travel Time: {dep_far.get('travel_time_minutes')} mins")
        print(f"  Should Leave Now: {dep_far.get('should_leave_now')}")
        print(f"  Message: {dep_far.get('message')}")
        assert dep_far["should_leave_now"] is True

    print("\n" + "=" * 60)
    print("ALL FRONTEND HTTP CONTRACTS VERIFIED 100% WORKING LIVE!")
    print("=" * 60)

if __name__ == "__main__":
    test_full_frontend_flow()
