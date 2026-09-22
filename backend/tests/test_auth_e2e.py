import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_complete_auth_suite():
    random_phone = f"99{uuid.uuid4().int % 100000000:08d}"
    user_name = "Kavitha Murthy"
    user_pass = "SecurePass@2026"

    print(f"\n--- Testing Auth E2E Flow with Phone: {random_phone} ---")

    # 1. Test short/invalid phone validation
    inv_res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": user_name,
        "phone": "12345",
        "password": user_pass,
        "confirmPassword": user_pass
    })
    assert inv_res.status_code == 400, f"Expected 400 for invalid phone, got {inv_res.status_code}"
    print("[PASS] Invalid phone length correctly rejected (400 Bad Request)")

    # 2. Test successful registration
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": user_name,
        "phone": random_phone,
        "password": user_pass,
        "confirmPassword": user_pass
    })
    assert reg_res.status_code == 201, f"Expected 201 Created, got {reg_res.status_code}: {reg_res.text}"
    reg_json = reg_res.json()
    assert reg_json["success"] is True
    assert reg_json["phone"] == random_phone
    assert reg_json["name"] == user_name
    print(f"[PASS] New patient registered successfully: ID={reg_json['patient_id']} (201 Created)")

    # 3. Test duplicate phone prevention
    dup_res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Different Name",
        "phone": random_phone,
        "password": "AnotherPassword123"
    })
    assert dup_res.status_code == 400, f"Expected 400 on duplicate, got {dup_res.status_code}"
    print("[PASS] Duplicate phone registration prevented (400 Bad Request)")

    # 4. Test login with wrong password
    bad_login = requests.post(f"{BASE_URL}/auth/login", json={
        "emailOrPhone": random_phone,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401, f"Expected 401 on wrong password, got {bad_login.status_code}"
    print("[PASS] Invalid password correctly rejected (401 Unauthorized)")

    # 5. Test login with correct phone + password
    good_login = requests.post(f"{BASE_URL}/auth/login", json={
        "emailOrPhone": random_phone,
        "password": user_pass
    })
    assert good_login.status_code == 200, f"Expected 200 on valid login, got {good_login.status_code}: {good_login.text}"
    login_data = good_login.json()
    assert login_data["success"] is True
    assert bool(login_data["token"]), "JWT Token must be returned"
    assert login_data["user"]["phone"] == random_phone
    assert login_data["user"]["name"] == user_name
    print(f"[PASS] Patient login successful: JWT token issued, user={login_data['user']['name']} (200 OK)")

    print("\n========================================================")
    print("ALL 5 AUTH & REGISTRATION PRODUCTION TESTS PASSED!")
    print("========================================================\n")

if __name__ == "__main__":
    test_complete_auth_suite()
