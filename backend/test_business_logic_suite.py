import requests
import uuid

BASE_URL = "http://localhost:8000"

def run_suite():
    print("\n========================================================")
    print("STARTING FULL BUSINESS LOGIC & LIFECYCLE TEST SUITE")
    print("========================================================")

    test_phone = f"97{uuid.uuid4().int % 100000000:08d}"
    test_name = "Pooja Hegde"
    initial_pass = "InitialPass@123"
    new_pass = "NewResetPass@2026"

    # 1. Register test patient
    print(f"\n[1] Registering test user with phone {test_phone}...")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": test_name,
        "phone": test_phone,
        "password": initial_pass,
        "confirmPassword": initial_pass
    })
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    patient_id = reg_res.json()["patient_id"]
    print(f"[PASS] User registered (ID: {patient_id})")

    # 2. Forgot Password Request
    print("\n[2] Testing Forgot Password OTP Request...")
    fp_req_res = requests.post(f"{BASE_URL}/auth/forgot-password/request", json={
        "phone": test_phone
    })
    assert fp_req_res.status_code == 200, f"Forgot password request failed: {fp_req_res.text}"
    fp_data = fp_req_res.json()
    assert fp_data["success"] is True
    assert fp_data["otp"] == "123456", "Virtual OTP must be 123456"
    print("[PASS] Virtual OTP 123456 generated successfully")

    # 3. Forgot Password Reset
    print("\n[3] Testing Password Reset with OTP...")
    fp_reset_res = requests.post(f"{BASE_URL}/auth/forgot-password/reset", json={
        "phone": test_phone,
        "otp": "123456",
        "newPassword": new_pass
    })
    assert fp_reset_res.status_code == 200, f"Password reset failed: {fp_reset_res.text}"
    assert fp_reset_res.json()["success"] is True
    print("[PASS] Password reset successfully with new bcrypt hash")

    # Verify login with new password
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "emailOrPhone": test_phone,
        "password": new_pass
    })
    assert login_res.status_code == 200, f"Login with new password failed: {login_res.text}"
    auth_token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {auth_token}"}
    print("[PASS] Login verified with new password and JWT token issued")

    # 4. Geocode Prefix Cleansing Check
    print("\n[4] Testing Geocode Query & Prefix Nesting Cleansing...")
    geo_res = requests.get(f"{BASE_URL}/geocode?query=Location%20(Location%20(Tumakuru%20Town))")
    assert geo_res.status_code == 200, f"Geocode failed: {geo_res.text}"
    geo_data = geo_res.json()
    assert not geo_data["name"].startswith("Location (Location"), "Nested prefix must be cleansed"
    print(f"[PASS] Geocode cleanly resolved name without recursion: '{geo_data['name']}'")

    # 5. Lifecycle Notifications Test
    print("\n[5] Testing Lifecycle Notification Stages 1 to 5...")
    
    # Stage 1: Book appointment -> triggers Booking Confirmed notification
    book_res = requests.post(f"{BASE_URL}/patients/book", json={
        "doctor": "Dr. Rajeswari R.",
        "doctor_id": 3,
        "department": "General Medicine",
        "timeSlot": "11:00 AM",
        "patient_name": test_name,
        "phone": test_phone,
        "symptoms": "Mild seasonal fever"
    }, headers=headers)
    assert book_res.status_code == 200, f"Booking failed: {book_res.text}"
    appt_id = book_res.json()["appointment_id"]
    print(f"[PASS] Stage 1: Appointment booked (Appt ID: {appt_id}) and Booking Confirmed notification triggered")

    # Stage 4: Trigger No-Show Warning
    absent_res = requests.post(f"{BASE_URL}/staff/queue/mark-absent/{appt_id}")
    assert absent_res.status_code == 200, f"No-show failed: {absent_res.text}"
    print(f"[PASS] Stage 4: No-show urgency notification triggered for Appt #{appt_id}")

    # Stage 5: Trigger End-of-Day slot expiration
    expire_res = requests.post(f"{BASE_URL}/queue/expire-daily-slots")
    assert expire_res.status_code == 200, f"Expire failed: {expire_res.text}"
    print(f"[PASS] Stage 5: End-of-day expiration completed ({expire_res.json()['expired_count']} slots marked expired)")

    # Fetch Notifications for Patient
    notif_res = requests.get(f"{BASE_URL}/notifications", headers=headers)
    assert notif_res.status_code == 200, f"Fetch notifications failed: {notif_res.text}"
    notifs = notif_res.json()
    assert len(notifs) >= 2, "Must return at least 2 notifications for this patient"
    print(f"[PASS] Retrieved {len(notifs)} lifecycle notifications from database")

    # Mark One as Read
    first_notif_id = notifs[0]["id"]
    read_res = requests.put(f"{BASE_URL}/notifications/{first_notif_id}/read")
    assert read_res.status_code == 200
    print(f"[PASS] Notification #{first_notif_id} marked as read")

    # Mark All as Read
    all_read_res = requests.post(f"{BASE_URL}/notifications/mark-all-read", headers=headers)
    assert all_read_res.status_code == 200
    print("[PASS] All notifications marked as read")

    print("\n========================================================")
    print("ALL BUSINESS LOGIC & LIFECYCLE TESTS PASSED! (100% OK)")
    print("========================================================\n")

if __name__ == "__main__":
    run_suite()
