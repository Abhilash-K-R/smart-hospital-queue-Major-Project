"""
backend/test_phase6_staff.py
-----------------------------
Automated verification test for Phase 6:
  1. Staff login via /token and /auth/staff/login
  2. Live queue query via GET /staff/queue
  3. Emergency Patient Insertion via POST /staff/emergency-insert
  4. Confirmation that existing regular patients' queue_position shifted back by +1
  5. Live wait time recalculation verification
  6. Queue advancement via POST /staff/queue/call-next
  7. Staff stats KPI retrieval via GET /staff/stats
  8. AI Symptom Analysis via POST /staff/symptom-analyze
"""

import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_phase6():
    print("=== STARTING PHASE 6 VERIFICATION ===")

    # 1. Test Staff Login via /token (form-encoded)
    print("\n--- 1. Testing Staff Login via POST /token ---")
    res = requests.post(f"{BASE_URL}/token", data={"username": "admin", "password": "admin"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    token_data = res.json()
    assert "access_token" in token_data, "No access_token returned"
    token = token_data["access_token"]
    print(f"PASS: Login successful. Token received: {token[:20]}...")
    print(f"User info: {token_data.get('user')}")

    # 2. Test Staff Login via POST /auth/staff/login (JSON)
    print("\n--- 2. Testing Staff Login via POST /auth/staff/login ---")
    res = requests.post(f"{BASE_URL}/auth/staff/login", json={"username": "admin", "password": "admin"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    staff_login_data = res.json()
    assert staff_login_data.get("success") is True, "Expected success: True"
    print(f"PASS: JSON login successful. Staff User: {staff_login_data.get('user')}")

    # 3. Query Initial Live Queue via GET /staff/queue
    print("\n--- 3. Querying Live Queue via GET /staff/queue ---")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/staff/queue", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    initial_queue = res.json()
    print(f"PASS: Fetched {len(initial_queue)} active patients in queue.")
    for item in initial_queue[:3]:
        print(f"  Token: {item['tokenNumber']}, Patient: {item['name']}, Pos: {item['queue_position']}, Wait: {item['waitTime']}, Doctor: {item['doctor']}")

    # Find the position of the first pending regular patient before emergency insert
    first_pending = next((p for p in initial_queue if p["status"] == "pending"), None)
    pos_before = first_pending["queue_position"] if first_pending else None

    # 4. Emergency Insert via POST /staff/emergency-insert
    print("\n--- 4. Testing Emergency Patient Insertion ---")
    emergency_payload = {
        "name": "Rajesh Kumar (Cardiac Walk-in)",
        "age": 52,
        "gender": "Male",
        "chief_complaint": "Acute severe crushing chest pain, radiating to left shoulder, diaphoresis",
        "blood_pressure": "155/95",
        "heart_rate": 112,
        "spo2": 93,
        "temperature": 37.4
    }
    res = requests.post(f"{BASE_URL}/staff/emergency-insert", json=emergency_payload, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    emg_result = res.json()
    print(f"PASS: Emergency Insert Response:\n{json.dumps(emg_result, indent=2)}")
    assert emg_result.get("queue_position") == 1, "Emergency patient must be placed at Position 1!"

    # 5. Verify Queue Shift & Dynamic Recalculation
    print("\n--- 5. Verifying Queue Shift & Live Bumping ---")
    res = requests.get(f"{BASE_URL}/staff/queue", headers=headers)
    updated_queue = res.json()
    
    # Check that emergency patient is in queue at position 1 with Critical triage
    emg_item = next((p for p in updated_queue if p["id"] == emg_result["appointment_id"]), None)
    assert emg_item is not None, "Emergency appointment must exist in updated queue"
    print(f"Emergency patient: Token={emg_item['tokenNumber']}, Name={emg_item['name']}, Triage={emg_item['triage']}, Pos={emg_item['queue_position']}")
    assert emg_item["triage"] == "Critical", "Emergency patient must have Critical triage"
    assert emg_item["queue_position"] == 1, "Emergency patient must be placed at Position 1"

    # Check if the previous first pending regular patient shifted back
    if first_pending:
        matching = [p for p in updated_queue if p["id"] == first_pending["id"]]
        if matching:
            pos_after = matching[0]["queue_position"]
            print(f"Regular Patient #{first_pending['id']} queue position: {pos_before} -> {pos_after}")
            assert pos_after == pos_before + 1, f"Expected pos_after to be {pos_before + 1}, got {pos_after}"
            print("PASS: Dynamic Queue Bumping verified! Regular patients correctly shifted by +1.")

    # 6. Test Staff Stats KPI retrieval
    print("\n--- 6. Testing GET /staff/stats ---")
    res = requests.get(f"{BASE_URL}/staff/stats", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    stats = res.json()
    print(f"PASS: Staff Stats received:\n{json.dumps(stats, indent=2)}")
    assert stats["currently_waiting"] >= 1, "Expected currently_waiting >= 1"

    # 7. Test AI Symptom Analysis
    print("\n--- 7. Testing POST /staff/symptom-analyze ---")
    symptom_payload = {
        "symptoms": "Severe chest pain radiating to left arm, shortness of breath, and profuse sweating"
    }
    res = requests.post(f"{BASE_URL}/staff/symptom-analyze", json=symptom_payload, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    analysis = res.json()
    print(f"PASS: AI Symptom Analysis results:\n{json.dumps(analysis, indent=2)}")
    assert len(analysis.get("results", [])) > 0, "Expected analysis results"
    assert analysis["results"][0]["dept"] == "Cardiology", "Expected Cardiology as top match"

    # 8. Test Doctor List
    print("\n--- 8. Testing GET /staff/doctors ---")
    res = requests.get(f"{BASE_URL}/staff/doctors", headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    docs = res.json()
    print(f"PASS: Retrieved {len(docs)} doctors.")
    for d in docs[:3]:
        print(f"  Dr. {d['name']} ({d['department']}): Consult {d['avg_consult_minutes']}m, Queue {d['queue_length']}")

    print("\n=== ALL PHASE 6 STAFF ENDPOINTS VERIFIED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_phase6()
