"""
backend/test_idempotent_booking.py
----------------------------------
Automated test suite verifying refined idempotency and duplicate prevention:
1. Primary user books for Myself -> Generates exactly 1 token.
2. Rapid duplicate for Myself -> Blocked with HTTP 409 Conflict.
3. Same primary user books for Dependent "Aarav" on same day with same doctor -> Succeeds with distinct token.
4. Same primary user books for Dependent "Meera" on same day with same doctor -> Succeeds with distinct token.
5. Duplicate booking for Dependent "Aarav" -> Blocked with HTTP 409 Conflict.
"""

import time
import requests
import json

BASE_URL = "http://localhost:8000"

def test_idempotent_booking():
    print("\n--- Starting Refined Idempotency & Dependent Isolation Test ---", flush=True)
    unique_suffix = str(int(time.time()))[-8:]
    phone = f"97{unique_suffix}"
    primary_name = f"Laxuman G {unique_suffix[-4:]}"
    target_date = "2026-09-24"

    # Register primary user
    reg_payload = {
        "fullName": primary_name,
        "phone": phone,
        "password": "Password@123"
    }
    reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload, timeout=30)
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"

    # Login
    login_res = requests.post(f"{BASE_URL}/auth/login", json={"emailOrPhone": phone, "password": "Password@123"}, timeout=30)
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Primary user books for Myself
    self_payload = {
        "doctor_id": 1,
        "doctor": "Dr. Rajeswari R.",
        "department": "General Medicine",
        "date": target_date,
        "timeSlot": "10:30 AM",
        "symptoms": "Follow-up consultation",
        "attendeeType": "myself",
        "patient_name": primary_name,
        "patient_age": 35,
        "patient_gender": "Male",
        "contact_phone": phone,
        "is_dependent": False
    }

    res1 = requests.post(f"{BASE_URL}/patients/book", json=self_payload, headers=headers, timeout=30)
    print(f"1. Book for Myself status: {res1.status_code}", flush=True)
    assert res1.status_code == 200, f"Expected 200 OK, got {res1.status_code}: {res1.text}"
    self_token = res1.json()["tokenNumber"]
    print(f"   Allocated Token for Myself: {self_token}", flush=True)

    # 2. Duplicate booking for Myself -> Must be 409
    res2 = requests.post(f"{BASE_URL}/patients/book", json=self_payload, headers=headers, timeout=30)
    print(f"2. Duplicate Myself booking status: {res2.status_code}", flush=True)
    assert res2.status_code == 409, f"Expected 409 Conflict, got {res2.status_code}: {res2.text}"
    print(f"   Rejected message: {res2.json().get('detail')}", flush=True)

    # 3. Same user books for Dependent 1: "Aarav Ghotale" -> Must SUCCEED
    dep1_payload = {
        "doctor_id": 1,
        "doctor": "Dr. Rajeswari R.",
        "department": "General Medicine",
        "date": target_date,
        "timeSlot": "11:00 AM",
        "symptoms": "Fever & body pain",
        "attendeeType": "dependent",
        "patient_name": "Aarav Ghotale",
        "patient_age": 9,
        "patient_gender": "Male",
        "contact_phone": "9845001122",
        "is_dependent": True
    }

    res3 = requests.post(f"{BASE_URL}/patients/book", json=dep1_payload, headers=headers, timeout=30)
    print(f"3. Book Dependent 1 (Aarav) status: {res3.status_code}", flush=True)
    assert res3.status_code == 200, f"Expected 200 OK for dependent, got {res3.status_code}: {res3.text}"
    dep1_token = res3.json()["tokenNumber"]
    print(f"   Allocated Token for Aarav: {dep1_token}", flush=True)
    assert dep1_token != self_token, "Dependent must receive a distinct token"

    # 4. Same user books for Dependent 2: "Meera Ghotale" -> Must SUCCEED
    dep2_payload = {
        "doctor_id": 1,
        "doctor": "Dr. Rajeswari R.",
        "department": "General Medicine",
        "date": target_date,
        "timeSlot": "11:30 AM",
        "symptoms": "Child routine wellness checkup",
        "attendeeType": "dependent",
        "patient_name": "Meera Ghotale",
        "patient_age": 5,
        "patient_gender": "Female",
        "contact_phone": "9845003344",
        "is_dependent": True
    }

    res4 = requests.post(f"{BASE_URL}/patients/book", json=dep2_payload, headers=headers, timeout=30)
    print(f"4. Book Dependent 2 (Meera) status: {res4.status_code}", flush=True)
    assert res4.status_code == 200, f"Expected 200 OK for second dependent, got {res4.status_code}: {res4.text}"
    dep2_token = res4.json()["tokenNumber"]
    print(f"   Allocated Token for Meera: {dep2_token}", flush=True)
    assert dep2_token not in [self_token, dep1_token], "Each dependent must receive a unique token"

    # 5. Duplicate booking attempt for Dependent 1 (Aarav) with same phone & doctor -> Must be 409
    res5 = requests.post(f"{BASE_URL}/patients/book", json=dep1_payload, headers=headers, timeout=30)
    print(f"5. Duplicate Dependent 1 booking status: {res5.status_code}", flush=True)
    assert res5.status_code == 409, f"Expected 409 Conflict for duplicate dependent, got {res5.status_code}: {res5.text}"
    print(f"   Rejected message: {res5.json().get('detail')}", flush=True)

    print("\n[SUCCESS] ALL REFINED IDEMPOTENCY & DEPENDENT TESTS PASSED!", flush=True)


if __name__ == "__main__":
    test_idempotent_booking()
