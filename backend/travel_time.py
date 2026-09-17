"""
travel_time.py
-------------
Provides travel-time estimation from a patient's location to the hospital.

Currently uses a MOCK function (get_mock_travel_time) since we haven't
enabled Google Cloud billing yet — no reason to activate a paid API
before the rest of the system is ready to actually use it.

WHEN READY TO GO LIVE:
  1. Enable billing on Google Cloud, get a restricted API key
  2. Add GOOGLE_MAPS_API_KEY to .env
  3. Switch the single line in get_travel_time_minutes() from
     get_mock_travel_time(...) to get_real_travel_time(...)
  Nothing else in the codebase needs to change — every other file
  calls get_travel_time_minutes(), never the mock/real functions directly.

Owner: Abhilash (Phase 4)
"""

import os
import random
import math
from dotenv import load_dotenv

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


def get_mock_travel_time(
    patient_lat: float,
    patient_lng: float,
    hospital_lat: float,
    hospital_lng: float,
) -> int:
    """
    Fake but reasonably realistic travel time, based on straight-line
    distance between two coordinates (not real road distance, but good
    enough to test our notification LOGIC before the real API is live).

    Uses the Haversine formula — standard way to calculate distance
    between two lat/lng points on Earth's curved surface.
    """
    R = 6371  # Earth's radius in kilometers

    lat1, lng1 = math.radians(patient_lat), math.radians(patient_lng)
    lat2, lng2 = math.radians(hospital_lat), math.radians(hospital_lng)

    dlat = lat2 - lat1
    dlng = lng2 - lng1

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    distance_km = R * c

    # Assume average city driving speed of ~25 km/h (accounts for traffic,
    # signals, etc. — not highway speed). Add a bit of random variation
    # so it doesn't feel robotically identical every time.
    base_minutes = (distance_km / 25) * 60
    variation = random.uniform(0.9, 1.2)

    return max(round(base_minutes * variation), 3)  # minimum 3 min, avoids 0/negative


def get_real_travel_time(
    patient_lat: float,
    patient_lng: float,
    hospital_lat: float,
    hospital_lng: float,
) -> int:
    """
    REAL Google Maps Distance Matrix API call — not active yet.
    Requires GOOGLE_MAPS_API_KEY to be set in .env and billing enabled
    on the Google Cloud project.

    Left here fully written so activating it later is a one-line swap
    in get_travel_time_minutes(), not a rewrite.
    """
    import requests

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": f"{patient_lat},{patient_lng}",
        "destinations": f"{hospital_lat},{hospital_lng}",
        "key": GOOGLE_MAPS_API_KEY,
        "departure_time": "now",  # accounts for LIVE traffic conditions
    }

    response = requests.get(url, params=params)
    data = response.json()

    duration_seconds = data["rows"][0]["elements"][0]["duration_in_traffic"]["value"]
    return round(duration_seconds / 60)


def get_travel_time_minutes(
    patient_lat: float,
    patient_lng: float,
    hospital_lat: float,
    hospital_lng: float,
) -> int:
    """
    Single entry point every other file should call. Internally decides
    whether to use the mock or real Google API, based on whether a real
    key is configured.
    """
    if GOOGLE_MAPS_API_KEY:
        return get_real_travel_time(patient_lat, patient_lng, hospital_lat, hospital_lng)
    else:
        return get_mock_travel_time(patient_lat, patient_lng, hospital_lat, hospital_lng)