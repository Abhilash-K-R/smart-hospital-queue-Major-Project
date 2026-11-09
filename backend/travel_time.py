"""
travel_time.py
-------------
Object-Oriented Live Travel-Time and Road Distance Estimation Engine.
Provides origin-to-destination transit duration from a patient's GPS coordinates
to Shridevi Hospital & Research Hospital, Tumakuru.

Architecture & Design Patterns:
  - Class: TravelTimeService (Encapsulates transit parameters, API configurations, and calculations)
  - Strategy Pattern:
      1. Primary: OpenRouteService (ORS) Driving Directions API (v2/directions/driving-car)
      2. Fallback: Haversine great-circle calculation with calibrated traffic/speed tiers
  - Singleton: default_travel_service (Shared service instance across API requests)
  - Functional Adapters: calculate_haversine_distance, get_travel_time_minutes, etc. (Backward compatibility)

Hospital Coordinates:
  Latitude: 13.376230
  Longitude: 77.097439 (Sira Road, Tumakuru - 572106)

Owner: Abhilash (Phase 4 / Section IV IEEE Architecture)
"""

from typing import Optional, Dict, Any
import os
import math
import requests
from dotenv import load_dotenv

load_dotenv()

HOSPITAL_LAT = 13.376230
HOSPITAL_LNG = 77.097439
OPENROUTESERVICE_API_KEY = os.getenv("OPENROUTESERVICE_API_KEY")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


class TravelTimeService:
    """
    Object-Oriented Service encapsulating transit calculation, routing API calls,
    and mathematical offline fallback estimation.
    """
    def __init__(
        self,
        hospital_lat: float = HOSPITAL_LAT,
        hospital_lng: float = HOSPITAL_LNG,
        api_key: Optional[str] = None,
        timeout: int = 4
    ):
        self.hospital_lat = hospital_lat
        self.hospital_lng = hospital_lng
        self.api_key = api_key or os.getenv("OPENROUTESERVICE_API_KEY")
        self.timeout = timeout

    def calculate_haversine(
        self,
        lat1: float,
        lng1: float,
        lat2: Optional[float] = None,
        lng2: Optional[float] = None
    ) -> float:
        """
        Calculates great-circle distance in kilometers using the Haversine formula.
        Defaults to hospital destination if destination coords are omitted.
        """
        target_lat = self.hospital_lat if lat2 is None else lat2
        target_lng = self.hospital_lng if lng2 is None else lng2

        r_km = 6371.0  # Earth's mean radius in kilometers
        phi1, phi2 = math.radians(lat1), math.radians(target_lat)
        dphi = math.radians(target_lat - lat1)
        dlambda = math.radians(target_lng - lng1)

        a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r_km * c

    def get_fallback_estimate(
        self,
        patient_lat: float,
        patient_lng: float,
        hospital_lat: Optional[float] = None,
        hospital_lng: Optional[float] = None
    ) -> int:
        """
        Calculates offline travel time (in minutes) based on corridor speed tiers.
        Assumes average urban/rural corridor speed of ~25-45 km/h.
        """
        dest_lat = hospital_lat or self.hospital_lat
        dest_lng = hospital_lng or self.hospital_lng
        distance_km = self.calculate_haversine(patient_lat, patient_lng, dest_lat, dest_lng)

        if distance_km <= 1.0:
            base_minutes = (distance_km / 15.0) * 60.0  # campus approach (~2-4 mins)
        elif distance_km <= 15.0:
            base_minutes = (distance_km / 25.0) * 60.0  # urban city traffic
        else:
            base_minutes = (distance_km / 45.0) * 60.0  # highway corridor

        return max(round(base_minutes), 2)

    def get_route_details(
        self,
        patient_lat: float,
        patient_lng: float,
        hospital_lat: Optional[float] = None,
        hospital_lng: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Queries OpenRouteService v2 Driving Directions API.
        Gracefully falls back to the Haversine model if the network is unavailable or timed out.
        """
        dest_lat = hospital_lat or self.hospital_lat
        dest_lng = hospital_lng or self.hospital_lng
        current_api_key = self.api_key or os.getenv("OPENROUTESERVICE_API_KEY")

        if not current_api_key:
            fallback_mins = self.get_fallback_estimate(patient_lat, patient_lng, dest_lat, dest_lng)
            fallback_km = round(self.calculate_haversine(patient_lat, patient_lng, dest_lat, dest_lng), 2)
            return {
                "success": True,
                "duration_minutes": fallback_mins,
                "distance_km": fallback_km,
                "source": "haversine_fallback"
            }

        url = "https://api.openrouteservice.org/v2/directions/driving-car"
        headers = {
            "Authorization": current_api_key,
            "Accept": "application/json, application/geo+json"
        }
        params = {
            "start": f"{patient_lng},{patient_lat}",
            "end": f"{dest_lng},{dest_lat}"
        }

        try:
            response = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                features = data.get("features", [])
                if features:
                    summary = features[0].get("properties", {}).get("summary", {})
                    distance_meters = summary.get("distance", 0.0)
                    duration_seconds = summary.get("duration", 0.0)

                    return {
                        "success": True,
                        "duration_minutes": max(round(duration_seconds / 60.0, 1), 2.0),
                        "distance_km": round(distance_meters / 1000.0, 2),
                        "source": "openrouteservice"
                    }
        except Exception as err:
            print(f"[TravelTimeService] ORS request failed ({err}). Utilizing Haversine offline fallback.")

        # Resilient fallback execution
        fallback_mins = self.get_fallback_estimate(patient_lat, patient_lng, dest_lat, dest_lng)
        fallback_km = round(self.calculate_haversine(patient_lat, patient_lng, dest_lat, dest_lng), 2)
        return {
            "success": True,
            "duration_minutes": fallback_mins,
            "distance_km": fallback_km,
            "source": "haversine_fallback"
        }

    def get_travel_minutes(
        self,
        patient_lat: float,
        patient_lng: float,
        hospital_lat: Optional[float] = None,
        hospital_lng: Optional[float] = None
    ) -> int:
        """Primary duration resolver returning integer minutes for departure policies."""
        details = self.get_route_details(patient_lat, patient_lng, hospital_lat, hospital_lng)
        return int(round(details.get("duration_minutes", 10.0)))


# Global Service Singleton
default_travel_service = TravelTimeService()

# Backward-compatible functional adapters
def calculate_haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    return default_travel_service.calculate_haversine(lat1, lng1, lat2, lng2)

def get_mock_travel_time(
    patient_lat: float,
    patient_lng: float,
    hospital_lat: float = HOSPITAL_LAT,
    hospital_lng: float = HOSPITAL_LNG,
) -> int:
    return default_travel_service.get_fallback_estimate(patient_lat, patient_lng, hospital_lat, hospital_lng)

def get_ors_travel_details(
    patient_lat: float,
    patient_lng: float,
    hospital_lat: float = HOSPITAL_LAT,
    hospital_lng: float = HOSPITAL_LNG,
) -> dict:
    return default_travel_service.get_route_details(patient_lat, patient_lng, hospital_lat, hospital_lng)

def get_travel_time_minutes(
    patient_lat: float,
    patient_lng: float,
    hospital_lat: float = HOSPITAL_LAT,
    hospital_lng: float = HOSPITAL_LNG,
) -> int:
    return default_travel_service.get_travel_minutes(patient_lat, patient_lng, hospital_lat, hospital_lng)
