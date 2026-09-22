"""
backend/test_auth_booking_flow.py
---------------------------------
Automated test suite verifying:
1. Direct authenticated booking with JWT Bearer token succeeds.
2. Booking with user credentials/phone fallback when token is missing/transitional succeeds.
3. Duplicate bookings are properly rejected with 409 Conflict.
4. No unexpected 401 or "Not authenticated" breaks happen for valid patient operations.
"""

import time
import requests

BASE_URL = "http://localhost:8000"

def test_auth_booking_flow():
    print("\n--- Starting Authentication & Fallback Booking Verification ---", flush=True)
    suffix = str(int(time.time()))[-8:]
    phone = f"96{suffix}"
    full_name = f"Laxuman Ghotale {suffix[-3:]}"
    target_date = "2026-09-25"

    # Step 1: User Registration
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "fullName": full_name,
        "phone": phone,
        "password": "Password@123"
    }, timeout=30)
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    print(f"[1] Registered user {full_name} ({phone})", flush=True)

    # Step 2: User Login
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "emailOrPhone": phone,
        "password": "Password@123"
    }, timeout=30)
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["token"]
    print(f"[2] Obtained JWT token: {token[:20]}...", flush=True)

    # Step 3: Book appointment WITH Bearer token
    booking_payload = {
        "doctor_id": 1,
        "doctor": "Dr. Priya Sharma",
        "department": "Cardiology",
        "date": target_date,
        "time_slot": "10:30 AM",
        "symptoms": "Mild chest heaviness",
        "patient_name": full_name,
        "patient_age": 35,
        "patient_gender": "Male",
        "contact_phone": phone,
        "is_dependent": False
    }

    res_auth = requests.post(
        f"{BASE_URL}/patients/book",
        json=booking_payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=30
    )
    print(f"[3] Authenticated Booking status: {res_auth.status_code}", flush=True)
    assert res_auth.status_code == 200, f"Expected 200, got {res_auth.status_code}: {res_auth.text}"
    token_num = res_auth.json()["tokenNumber"]
    print(f"    Allocated Token: {token_num}", flush=True)

    # Step 4: Duplicate booking rejected with 409
    res_dup = requests.post(
        f"{BASE_URL}/patients/book",
        json=booking_payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=30
    )
    print(f"[4] Duplicate booking status: {res_dup.status_code}", flush=True)
    assert res_dup.status_code == 409, f"Expected 409, got {res_dup.status_code}: {res_dup.text}"
    print(f"    Message: {res_dup.json().get('detail')}", flush=True)

    # Step 5: Unauthenticated fallback with phone & patient info (e.g. demo mode / token desync)
    fallback_payload = {
        "doctor_id": 2,
        "doctor": "Dr. Ramesh Babu",
        "department": "Orthopedics",
        "date": target_date,
        "time_slot": "11:30 AM",
        "symptoms": "Knee pain",
        "patient_name": f"Dependent {suffix[-3:]}",
        "patient_age": 28,
        "patient_gender": "Female",
        "contact_phone": f"95{suffix}",
        "is_dependent": True,
        "phone": phone
    }
    res_fallback = requests.post(
        f"{BASE_URL}/patients/book",
        json=fallback_payload,
        timeout=30
    )
    print(f"[5] Unauthenticated phone-fallback booking status: {res_fallback.status_code}", flush=True)
    assert res_fallback.status_code == 200, f"Expected 200, got {res_fallback.status_code}: {res_fallback.text}"
    fallback_token = res_fallback.json()["tokenNumber"]
    print(f"    Allocated Token via fallback: {fallback_token}", flush=True)

    print("\n[SUCCESS] ALL AUTHENTICATION AND BOOKING FLOW TESTS PASSED!", flush=True)

if __name__ == "__main__":
    test_auth_booking_flow()
