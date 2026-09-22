"""
travel_time.py
-------------
Provides live travel-time and road distance estimation from a patient's
location to Shridevi Hospital & Research Hospital, Tumakuru.

Primary Engine: OpenRouteService (ORS) Directions API (v2/directions/driving-car)
Fallback Engine: Haversine distance formula with speed/traffic modeling for offline resilience.

Hospital Coordinates:
  Latitude: 13.376230
  Longitude: 77.097439 (Sira Road, Tumakuru - 572106)

Owner: Abhilash (Phase 4 / Section IV IEEE Architecture)
"""

import os
import math
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTESERVICE_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

HOSPITAL_LAT = 13.376230
HOSPITAL_LNG = 77.097439


def calculate_haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculates great-circle distance in kilometers between two lat/lng coordinates.
    """
    R = 6371.0  # Earth's radius in kilometers
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def get_mock_travel_time(
    patient_lat: float,
    patient_lng: float,
    hospital_lat: float = HOSPITAL_LAT,
    hospital_lng: float = HOSPITAL_LNG,
) -> int:
    """
    Haversine fallback travel time (in minutes) based on straight-line distance.
    Assumes average urban/rural corridor speed of ~28 km/h.
    """
    distance_km = calculate_haversine_distance(patient_lat, patient_lng, hospital_lat, hospital_lng)
    
    # Speed tiers: near campus vs district highway
    if distance_km <= 1.0:
        base_minutes = (distance_km / 15.0) * 60.0  # ~2-4 mins campus approach
    elif distance_km <= 15.0:
        base_minutes = (distance_km / 25.0) * 60.0  # city traffic
    else:
        base_minutes = (distance_km / 45.0) * 60.0  # national highway corridor

    return max(round(base_minutes), 2)


def get_ors_travel_details(
    patient_lat: float,
    patient_lng: float,
    hospital_lat: float = HOSPITAL_LAT,
    hospital_lng: float = HOSPITAL_LNG,
) -> dict:
    """
    Calls OpenRouteService v2 Driving Directions to get exact road distance and duration.
    Falls back gracefully to Haversine on timeout, network error, or invalid response.
    """
    api_key = os.getenv("OPENROUTESERVICE_API_KEY")
    if not api_key:
        print("[TravelTime] OPENROUTESERVICE_API_KEY not found. Using Haversine fallback.")
        fallback_mins = get_mock_travel_time(patient_lat, patient_lng, hospital_lat, hospital_lng)
        fallback_km = round(calculate_haversine_distance(patient_lat, patient_lng, hospital_lat, hospital_lng), 2)
        return {
            "success": True,
            "duration_minutes": fallback_mins,
            "distance_km": fallback_km,
            "source": "haversine_fallback"
        }

    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    headers = {
        "Authorization": api_key,
        "Accept": "application/json, application/geo+json"
    }
    # Note: OpenRouteService standard expects longitude first (lng, lat)
    params = {
        "start": f"{patient_lng},{patient_lat}",
        "end": f"{hospital_lng},{hospital_lat}"
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=4)
        if response.status_code == 200:
            data = response.json()
            features = data.get("features", [])
            if features:
                summary = features[0].get("properties", {}).get("summary", {})
                distance_meters = summary.get("distance", 0.0)
                duration_seconds = summary.get("duration", 0.0)

                distance_km = round(distance_meters / 1000.0, 2)
                duration_minutes = max(round(duration_seconds / 60.0, 1), 2.0)

                return {
                    "success": True,
                    "duration_minutes": duration_minutes,
                    "distance_km": distance_km,
                    "source": "openrouteservice"
                }

        print(f"[TravelTime] ORS returned status {response.status_code}: {response.text[:200]}. Using Haversine.")
    except Exception as e:
        print(f"[TravelTime] ORS request failed: {e}. Using Haversine.")

    fallback_mins = get_mock_travel_time(patient_lat, patient_lng, hospital_lat, hospital_lng)
    fallback_km = round(calculate_haversine_distance(patient_lat, patient_lng, hospital_lat, hospital_lng), 2)
    return {
        "success": True,
        "duration_minutes": fallback_mins,
        "distance_km": fallback_km,
        "source": "haversine_fallback"
    }


def get_travel_time_minutes(
    patient_lat: float,
    patient_lng: float,
    hospital_lat: float = HOSPITAL_LAT,
    hospital_lng: float = HOSPITAL_LNG,
) -> int:
    """
    Primary travel duration resolver. Returns integer minutes.
    Used by departure checks and queue prediction endpoints.
    """
    details = get_ors_travel_details(patient_lat, patient_lng, hospital_lat, hospital_lng)
    return int(round(details.get("duration_minutes", 10.0)))