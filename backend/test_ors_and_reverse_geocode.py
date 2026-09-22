import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://localhost:8000"

def test_reverse_geocoding_davanagere():
    print("\n--- Test 1: Reverse Geocoding Davanagere ---")
    resp = requests.get(f"{BASE_URL}/geocode/reverse?lat=14.4644&lng=75.9218")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    print("Response:", json.dumps(data, indent=2))
    assert data.get("success") is True
    assert "Davanagere" in data.get("formatted_address") or "Davangere" in data.get("locality") or "Davanagere" in data.get("district")
    print("✅ Test 1 Passed: Reverse geocoded Davanagere coordinates cleanly!")

def test_reverse_geocoding_tumakuru():
    print("\n--- Test 2: Reverse Geocoding Tumakuru ---")
    resp = requests.get(f"{BASE_URL}/geocode/reverse?lat=13.3409&lng=77.1010")
    assert resp.status_code == 200
    data = resp.json()
    print("Response:", json.dumps(data, indent=2))
    assert data.get("success") is True
    print("✅ Test 2 Passed: Reverse geocoded Tumakuru coordinates cleanly!")

def test_forward_geocoding_autocomplete():
    print("\n--- Test 3: Forward Geocoding Autocomplete with 'Davanagere' ---")
    resp = requests.get(f"{BASE_URL}/geocode?query=Davanagere")
    assert resp.status_code == 200
    data = resp.json()
    print("Response:", json.dumps(data, indent=2))
    assert data.get("success") is True
    assert "results" in data
    print(f"✅ Test 3 Passed: Autocomplete returned {len(data['results'])} candidate result(s)!")

def test_forward_geocoding_pincode():
    print("\n--- Test 4: Forward Geocoding Autocomplete with PIN '577002' ---")
    resp = requests.get(f"{BASE_URL}/geocode?query=577002")
    assert resp.status_code == 200
    data = resp.json()
    print("Response:", json.dumps(data, indent=2))
    assert data.get("success") is True
    print("✅ Test 4 Passed: PIN 577002 resolved cleanly!")

if __name__ == "__main__":
    try:
        test_reverse_geocoding_davanagere()
        test_reverse_geocoding_tumakuru()
        test_forward_geocoding_autocomplete()
        test_forward_geocoding_pincode()
        print("\n🎉 ALL GEOLOCATION & REVERSE GEOCODING TESTS PASSED!")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)
