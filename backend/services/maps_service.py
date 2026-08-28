"""
backend/services/maps_service.py
--------------------------------
Provides real-time travel duration and distance calculations between patient coordinates
and the hospital using the Google Maps Distance Matrix API.

Includes a robust Haversine + urban traffic heuristic fallback mechanism if the API key
is not set, quota limits are reached, or network connectivity is unavailable.

Owner: Naveen (Phase 4)
"""

import math
import logging
import httpx
from typing import Dict, Any

from config import GOOGLE_MAPS_API_KEY, HOSPITAL_LATITUDE, HOSPITAL_LONGITUDE

logger = logging.getLogger(__name__)

# Constants for fallback heuristic
EARTH_RADIUS_KM = 6371.0
ASSUMED_URBAN_SPEED_KMH = 30.0  # Average urban driving speed (km/h) in Indian city traffic
ROAD_TORTUOSITY_FACTOR = 1.25   # Road distance vs straight-line distance ratio


def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Computes straight-line distance (in kilometers) between two GPS points using the Haversine formula.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c


def get_fallback_travel_estimate(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    reason: str = "Fallback Heuristic",
) -> Dict[str, Any]:
    """
    Calculates estimated travel time and distance using Haversine formula
    and urban traffic assumptions (30 km/h avg speed + 1.25 road curvature multiplier).
    """
    straight_dist_km = calculate_haversine_distance(
        origin_lat, origin_lng, dest_lat, dest_lng
    )
    # Estimate actual road distance
    estimated_road_dist_km = round(straight_dist_km * ROAD_TORTUOSITY_FACTOR, 2)

    # Estimate travel time: (distance / speed) * 60 minutes
    # Add a minimum of 2 minutes for immediate vicinity
    estimated_time_minutes = max(
        2.0, round((estimated_road_dist_km / ASSUMED_URBAN_SPEED_KMH) * 60.0, 1)
    )

    return {
        "travel_duration_minutes": estimated_time_minutes,
        "travel_distance_km": estimated_road_dist_km,
        "traffic_duration_seconds": int(estimated_time_minutes * 60),
        "source": "haversine_fallback",
        "details": f"Estimated via Haversine calculation ({reason})",
        "origin": {"lat": origin_lat, "lng": origin_lng},
        "destination": {"lat": dest_lat, "lng": dest_lng},
    }


async def get_travel_time(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float = HOSPITAL_LATITUDE,
    dest_lng: float = HOSPITAL_LONGITUDE,
) -> Dict[str, Any]:
    """
    Asynchronously queries Google Maps Distance Matrix API for real-time driving duration
    with live traffic. Falls back to Haversine heuristic if API is unavailable or unconfigured.

    Returns:
        Dict containing:
          - travel_duration_minutes (float)
          - travel_distance_km (float)
          - traffic_duration_seconds (int)
          - source ("google_maps" or "haversine_fallback")
          - details (str)
    """
    # If API key is missing or dummy placeholder, use the heuristic directly
    if not GOOGLE_MAPS_API_KEY or "YOUR_" in GOOGLE_MAPS_API_KEY:
        return get_fallback_travel_estimate(
            origin_lat, origin_lng, dest_lat, dest_lng, reason="Google Maps API key not configured"
        )

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": f"{origin_lat},{origin_lng}",
        "destinations": f"{dest_lat},{dest_lng}",
        "mode": "driving",
        "departure_time": "now",
        "key": GOOGLE_MAPS_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(url, params=params)

            if response.status_code != 200:
                logger.warning(
                    f"Google Maps API returned HTTP {response.status_code}: {response.text}"
                )
                return get_fallback_travel_estimate(
                    origin_lat, origin_lng, dest_lat, dest_lng, reason=f"HTTP {response.status_code}"
                )

            data = response.json()

            # Verify API top-level status
            if data.get("status") != "OK":
                error_msg = data.get("error_message", data.get("status"))
                logger.warning(f"Google Maps API status not OK: {error_msg}")
                return get_fallback_travel_estimate(
                    origin_lat, origin_lng, dest_lat, dest_lng, reason=f"API Status: {data.get('status')}"
                )

            rows = data.get("rows", [])
            if not rows or not rows[0].get("elements"):
                return get_fallback_travel_estimate(
                    origin_lat, origin_lng, dest_lat, dest_lng, reason="No routes found in response"
                )

            element = rows[0]["elements"][0]
            element_status = element.get("status")

            if element_status != "OK":
                return get_fallback_travel_estimate(
                    origin_lat, origin_lng, dest_lat, dest_lng, reason=f"Route status: {element_status}"
                )

            # Prefer duration_in_traffic (seconds) if available, otherwise regular duration
            duration_data = element.get("duration_in_traffic") or element.get("duration", {})
            distance_data = element.get("distance", {})

            duration_seconds = duration_data.get("value", 0)
            distance_meters = distance_data.get("value", 0)

            duration_minutes = max(1.0, round(duration_seconds / 60.0, 1))
            distance_km = round(distance_meters / 1000.0, 2)

            return {
                "travel_duration_minutes": duration_minutes,
                "travel_distance_km": distance_km,
                "traffic_duration_seconds": duration_seconds,
                "source": "google_maps",
                "details": "Live traffic duration from Google Maps Distance Matrix API",
                "origin": {"lat": origin_lat, "lng": origin_lng},
                "destination": {"lat": dest_lat, "lng": dest_lng},
            }

    except httpx.RequestError as exc:
        logger.error(f"Network error querying Google Maps API: {exc}")
        return get_fallback_travel_estimate(
            origin_lat, origin_lng, dest_lat, dest_lng, reason=f"Network error: {type(exc).__name__}"
        )
    except Exception as exc:
        logger.error(f"Unexpected error in maps_service: {exc}")
        return get_fallback_travel_estimate(
            origin_lat, origin_lng, dest_lat, dest_lng, reason=f"Unexpected error: {str(exc)}"
        )
