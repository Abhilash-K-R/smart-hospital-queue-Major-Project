import requests
import json

BASE = "http://127.0.0.1:8000"

print("=" * 65)
print("1. SERVER HEALTH CHECK")
print("=" * 65)
r = requests.get(f"{BASE}/")
print("GET / -> Status:", r.status_code)
print("Response:", json.dumps(r.json(), indent=2))

print("\n" + "=" * 65)
print("2. PATIENT AUTHENTICATION (Real JWT via HTTP)")
print("=" * 65)
email = "abhi_live_check@hospital.com"
password = "LivePassword123"

# Register (if not exists)
signup_res = requests.post(
    f"{BASE}/signup/patient",
    json={"name": "Abhi Live Verification", "phone": "9876543210", "email": email, "password": password}
)
if signup_res.status_code == 200:
    print(f"Patient created: ID {signup_res.json()['id']}")
else:
    print("Patient already registered, proceeding to login.")

# Login
login_res = requests.post(
    f"{BASE}/login/patient",
    json={"email": email, "password": password}
)
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("POST /login/patient -> 200 OK")
print(f"JWT Access Token: {token[:25]}...{token[-15:]}")

print("\n" + "=" * 65)
print("3. REAL APPOINTMENT BOOKING (HTTP)")
print("=" * 65)
book_res = requests.post(f"{BASE}/appointments", json={"doctor_id": 1}, headers=headers)
assert book_res.status_code == 200, f"Booking failed: {book_res.text}"
appointment = book_res.json()
appt_id = appointment["id"]
print(f"POST /appointments -> 200 OK")
print(f"Appointment ID: {appt_id}")
print(f"Doctor ID:      {appointment['doctor_id']}")
print(f"Queue Position: {appointment['queue_position']}")
print(f"Status:         {appointment['status']}")

print("\n" + "=" * 65)
print("4. REAL HTTP CALL: POST /departure-check (NEARBY PATIENT)")
print("   Coordinates: 13.379230, 77.100439 (~500m from SIET Tumakuru)")
print("=" * 65)
nearby_payload = {
    "appointment_id": appt_id,
    "patient_lat": 13.379230,
    "patient_lng": 77.100439
}
nearby_res = requests.post(f"{BASE}/departure-check", json=nearby_payload, headers=headers)
print(f"HTTP Status: {nearby_res.status_code} OK")
print("Response JSON:")
print(json.dumps(nearby_res.json(), indent=2))

print("\n" + "=" * 65)
print("5. REAL HTTP CALL: POST /departure-check (FAR PATIENT)")
print("   Coordinates: 12.9716, 77.5946 (~70km in Bangalore)")
print("=" * 65)
far_payload = {
    "appointment_id": appt_id,
    "patient_lat": 12.9716,
    "patient_lng": 77.5946
}
far_res = requests.post(f"{BASE}/departure-check", json=far_payload, headers=headers)
print(f"HTTP Status: {far_res.status_code} OK")
print("Response JSON:")
print(json.dumps(far_res.json(), indent=2))

print("\n" + "=" * 65)
print("6. SWAGGER /docs OPENAPI REGISTRATION CHECK")
print("=" * 65)
openapi_res = requests.get(f"{BASE}/openapi.json")
paths = openapi_res.json().get("paths", {})
is_registered = "/departure-check" in paths
print(f"Is /departure-check present in Swagger /docs OpenAPI spec?: {is_registered}")
if is_registered:
    spec = paths["/departure-check"]["post"]
    print("Endpoint Summary:", spec.get("summary", "N/A"))
    print("Tags:", spec.get("tags", []))
    print("Response 200 Ref:", spec.get("responses", {}).get("200", {}).get("content", {}).get("application/json", {}).get("schema", {}))
print("=" * 65)
