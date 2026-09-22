import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_tests():
    print("=== Testing Family Member / Dependent Booking Flow ===", flush=True)
    
    # 1. Register a fresh unique primary patient account
    unique_suffix = str(int(time.time()))[-8:]
    phone = f"98{unique_suffix}"
    primary_name = f"Suresh Raina {unique_suffix[-4:]}"
    reg_payload = {
        "fullName": primary_name,
        "phone": phone,
        "password": "Password@123"
    }
    
    reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    print(f"Register status: {reg_res.status_code}, data: {reg_res.text}", flush=True)
    assert reg_res.status_code == 201, "Registration failed"
    
    login_res = requests.post(f"{BASE_URL}/auth/login", json={"emailOrPhone": phone, "password": "Password@123"})
    print(f"Login status: {login_res.status_code}", flush=True)
    assert login_res.status_code == 200, "Login failed"
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Book for Myself
    self_payload = {
        "doctor_id": 1,
        "doctor": "Dr. Rajeswari R.",
        "department": "General Medicine",
        "date": "2026-09-22",
        "timeSlot": "11:00 AM",
        "symptoms": "Routine checkup and blood pressure review",
        "attendeeType": "myself",
        "patient_name": primary_name,
        "patient_age": 42,
        "patient_gender": "Male",
        "contact_phone": phone,
        "is_dependent": False
    }
    
    book_self = requests.post(f"{BASE_URL}/patients/book", json=self_payload, headers=headers)
    print(f"Book Self status: {book_self.status_code}, Token: {book_self.json().get('tokenNumber')}", flush=True)
    assert book_self.status_code in [200, 201], f"Book self failed: {book_self.text}"
    self_data = book_self.json()
    assert self_data["patient_name"] == primary_name
    assert self_data["contact_phone"] == phone
    assert self_data["is_dependent"] is False
    
    # 3. Book for Dependent (e.g. child with alternate contact phone)
    dep_payload = {
        "doctor_id": 2,
        "doctor": "Dr. Priya Sharma",
        "department": "Pediatrics",
        "date": "2026-09-22",
        "timeSlot": "11:30 AM",
        "symptoms": "Child seasonal cold and mild fever",
        "attendeeType": "dependent",
        "patient_name": "Aarav Raina",
        "patient_age": 8,
        "patient_gender": "Male",
        "contact_phone": "9845112233",
        "is_dependent": True
    }
    
    book_dep = requests.post(f"{BASE_URL}/patients/book", json=dep_payload, headers=headers)
    print(f"Book Dependent status: {book_dep.status_code}, Token: {book_dep.json().get('tokenNumber')}", flush=True)
    assert book_dep.status_code in [200, 201], f"Book dependent failed: {book_dep.text}"
    dep_data = book_dep.json()
    print("Dependent Booking Response:", json.dumps(dep_data, indent=2), flush=True)
    assert dep_data["patient_name"] == "Aarav Raina", f"Expected Aarav Raina, got {dep_data.get('patient_name')}"
    assert dep_data["contact_phone"] == "9845112233", f"Expected 9845112233, got {dep_data.get('contact_phone')}"
    assert dep_data["is_dependent"] is True, f"Expected is_dependent=True, got {dep_data.get('is_dependent')}"
    
    # 4. Check Staff Queue (/staff/queue)
    queue_res = requests.get(f"{BASE_URL}/staff/queue")
    assert queue_res.status_code == 200, "Fetch staff queue failed"
    queue = queue_res.json()
    
    dep_queue_item = next((item for item in queue if item["id"] == dep_data["appointment_id"]), None)
    assert dep_queue_item is not None, f"Appointment {dep_data['appointment_id']} not found in staff queue"
    print("Found Dependent in Staff Queue:", json.dumps(dep_queue_item, indent=2), flush=True)
    assert dep_queue_item["name"] == "Aarav Raina"
    assert dep_queue_item["patient_name"] == "Aarav Raina"
    assert dep_queue_item["patient_age"] == 8
    assert dep_queue_item["patient_gender"] == "Male"
    assert dep_queue_item["contact_phone"] == "9845112233"
    assert dep_queue_item["is_dependent"] is True
    assert primary_name in (dep_queue_item["primary_patient_name"] or ""), f"Expected {primary_name} in {dep_queue_item.get('primary_patient_name')}"
    
    # 5. Check Departure SMS Preview
    dispatch_res = requests.post(f"{BASE_URL}/notifications/dispatch-preview", json={
        "appointment_id": dep_data["appointment_id"]
    })
    assert dispatch_res.status_code == 200, "Dispatch preview failed"
    disp_data = dispatch_res.json()
    print("Dispatch preview response:", json.dumps(disp_data, indent=2), flush=True)
    assert disp_data["patient_name"] == "Aarav Raina"
    assert disp_data["phone"] == "9845112233"
    
    print("\n[SUCCESS] ALL DEPENDENT BOOKING TESTS PASSED!", flush=True)



if __name__ == "__main__":
    run_tests()
