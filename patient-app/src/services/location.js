/**
 * patient-app/src/services/location.js
 * ------------------------------------
 * Browser Geolocation API service helper.
 * Handles permission checks, high-accuracy GPS position retrieval,
 * live position tracking, and simulated fallback coordinates for testing.
 *
 * Owner: Naveen (Phase 4)
 */

// SIET Tumakuru / Hospital Default reference coordinates
export const HOSPITAL_COORDINATES = {
  latitude: 13.340881,
  longitude: 77.100601,
  name: "SIET Smart Hospital Center",
  address: "BH Road, Tumakuru, Karnataka 572103"
};

// Simulated Patient Origin (approx 4.5 km away) for demo / testing without physical movement
export const DEFAULT_DEMO_COORDINATES = {
  latitude: 13.352400,
  longitude: 77.123500,
  label: "Tumakuru Town Center (~4.5 km from hospital)"
};

/**
 * Checks current browser permission state for geolocation.
 * @returns {Promise<'granted' | 'prompt' | 'denied' | 'unsupported'>}
 */
export async function checkLocationPermission() {
  if (!navigator.geolocation) {
    return 'unsupported';
  }

  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state; // 'granted', 'prompt', or 'denied'
    } catch (err) {
      console.warn("Permissions API not supported for geolocation:", err);
    }
  }

  return 'prompt';
}

/**
 * Requests the patient's current GPS position with high accuracy.
 * @param {PositionOptions} options
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number, timestamp: number }>}
 */
export function getCurrentCoordinates(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let message = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access was denied. Please allow location access for live traffic and departure alerts.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        const customError = new Error(message);
        customError.code = error.code;
        reject(customError);
      },
      defaultOptions
    );
  });
}

/**
 * Subscribes to live position changes.
 * @param {(coords: { latitude: number, longitude: number, accuracy: number }) => void} onUpdate
 * @param {(error: Error) => void} onError
 * @returns {() => void} Cleanup function to stop watching
 */
export function watchPatientPosition(onUpdate, onError) {
  if (!navigator.geolocation) {
    if (onError) onError(new Error("Geolocation not supported"));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onUpdate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp
      });
    },
    (err) => {
      if (onError) onError(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 15000
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
