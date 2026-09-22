import requests
import json

BASE = "http://127.0.0.1:8000"

def test_dispatch_notification_preview_endpoint():
    payload = {
        "patient_name": "Laxuman S",
        "phone": "9876543210",
        "patient_lat": 13.3400,
        "patient_lng": 77.1000
    }

    response = requests.post(f"{BASE}/notifications/dispatch-preview", json=payload)
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()

    # Verify response structure
    assert data["success"] is True
    assert "tokenNumber" in data
    assert "whatsapp_text" in data
    assert "sms_text" in data
    assert "whatsapp_share_url" in data
    assert "google_maps_url" in data

    # Verify Shridevi branding in WhatsApp
    whatsapp_text = data["whatsapp_text"]
    assert "SHRIDEVI HOSPITAL" in whatsapp_text
    assert "Laxuman S" in whatsapp_text
    assert "maps.google.com" in whatsapp_text
    assert data["whatsapp_share_url"].startswith("https://wa.me/")

    # Verify SMS format
    sms_text = data["sms_text"]
    assert "Shridevi Hospital" in sms_text
    assert "Laxuman S" in sms_text

    print("[PASS] Dispatch preview verification passed with Shridevi Hospital branding!")
    print("\nSample WhatsApp Alert:\n" + "-"*40 + "\n" + whatsapp_text.encode('ascii', 'replace').decode('ascii') + "\n" + "-"*40)
    print("\nSample SMS Alert:\n" + "-"*40 + "\n" + sms_text.encode('ascii', 'replace').decode('ascii') + "\n" + "-"*40)

if __name__ == "__main__":
    print("=" * 60)
    print("TESTING DUAL WHATSAPP + SMS DISPATCH WITH SHRIDEVI HOSPITAL")
    print("=" * 60)
    test_dispatch_notification_preview_endpoint()
    print("\nALL DUAL DISPATCH & SHRIDEVI BRANDING CHECKS PASSED SUCCESSFULLY! [OK]")

