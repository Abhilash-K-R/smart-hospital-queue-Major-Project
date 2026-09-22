import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getSavedLocation,
  saveLocation,
  resolvePincode,
  reverseGeocodeCoords,
  LOCATION_PRESETS,
  HOSPITAL_COORDINATES
} from '../utils/locationResolver';

/**
 * Custom hook for Dual-Mode Location Handling:
 * Mode A: Live GPS (navigator.geolocation) with explicit trigger, maximumAge: 0, strict permission handling & reverse geocoding
 * Mode B: Manual / Family Booking Mode (6-Digit PIN, Dynamic Autocomplete, or Preset Selection)
 */
export const useLocationResolver = () => {
  const [locationState, setLocationState] = useState(getSavedLocation);
  const [gpsCoords, setGpsCoords] = useState(() => 
    locationState.mode === 'gps' && locationState.lat && locationState.lng 
      ? { lat: Number(locationState.lat), lng: Number(locationState.lng) } 
      : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsErrorCode, setGpsErrorCode] = useState(null); // 1: DENIED, 2: UNAVAILABLE, 3: TIMEOUT
  const [isPermissionBlocked, setIsPermissionBlocked] = useState(false);

  // Request real device GPS with maximumAge: 0 (forces fresh satellite fix) and reverse geocoding
  const requestGPS = useCallback(() => {
    if (!('geolocation' in navigator)) {
      alert("Geolocation is not supported by your browser.");
      setGpsError('Geolocation is not supported by your browser.');
      setIsPermissionBlocked(true);
      return;
    }

    setIsLocating(true);
    setGpsError(null);
    setGpsErrorCode(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        console.log("GPS Raw Position received from browser:", latitude, longitude, "accuracy (m):", accuracy);
        const coords = {
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6))
        };
        setGpsCoords(coords);
        setIsPermissionBlocked(false);
        setGpsError(null);
        setGpsErrorCode(null);

        // Reverse geocode to get a clean human-readable name
        const geo = await reverseGeocodeCoords(coords.lat, coords.lng);
        const resolvedName = geo.formatted_address || geo.locality || 'Current GPS Location';

        setIsLocating(false);

        const updated = {
          mode: 'gps',
          label: `Live GPS (${geo.locality || 'Current Location'})`,
          name: resolvedName,
          locality: geo.locality || '',
          district: geo.district || '',
          pincode: '',
          lat: coords.lat,
          lng: coords.lng,
          status: 'acquired',
          isFamilyBooking: false,
          beneficiaryName: ''
        };
        setLocationState(updated);
        saveLocation(updated);
      },
      (err) => {
        setIsLocating(false);
        setGpsErrorCode(err.code);
        console.warn("GPS error callback fired:", err.code, err.message);

        let errorMsg = "⚠️ Live GPS unavailable on this device. Please use Mode B to search your location.";
        if (err.code === 1) {
          errorMsg = "⚠️ Location permission is blocked in your browser. Switch to Mode B to search your village/city manually.";
        } else if (err.code === 2) {
          errorMsg = "⚠️ GPS position unavailable on this device/network. Please use Mode B to search your location.";
        } else if (err.code === 3) {
          errorMsg = "⚠️ GPS request timed out. Please use Mode B to search your location.";
        }

        setIsPermissionBlocked(true);
        setGpsError(errorMsg);

        // Switch to Mode B with null coordinates so no fake location is injected
        const failedGpsState = {
          mode: 'manual',
          label: 'Mode B: Search Location',
          pincode: '',
          name: '',
          district: '',
          lat: null,
          lng: null,
          status: 'gps_failed',
          isFamilyBooking: false,
          beneficiaryName: '',
          note: 'Live GPS unavailable - use manual search'
        };
        setLocationState(failedGpsState);
        saveLocation(failedGpsState);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      } // maximumAge: 0 forces fresh satellite fix on mobile hardware
    );
  }, []);

  // Switch to Live GPS Mode
  const setLiveGPSMode = useCallback(async () => {
    setIsLocating(true);
    setGpsError(null);
    setGpsErrorCode(null);

    if (gpsCoords && gpsCoords.lat && gpsCoords.lng) {
      const geo = await reverseGeocodeCoords(gpsCoords.lat, gpsCoords.lng);
      const resolvedName = geo.formatted_address || geo.locality || 'Current Location';
      const updated = {
        mode: 'gps',
        label: `Live GPS (${geo.locality || 'Current Location'})`,
        name: resolvedName,
        locality: geo.locality || '',
        district: geo.district || '',
        pincode: '',
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
        status: 'acquired',
        isFamilyBooking: false,
        beneficiaryName: ''
      };
      setLocationState(updated);
      saveLocation(updated);
      setIsLocating(false);
      setIsPermissionBlocked(false);
    } else {
      // Trigger fresh GPS detection on user action
      requestGPS();
    }
  }, [gpsCoords, requestGPS]);

  // Switch to Manual / Pincode / Family Mode
  const setManualLocationByPincode = useCallback((pincode, options = {}) => {
    const resolved = resolvePincode(pincode);
    const isFamily = Boolean(options.isFamilyBooking);
    const beneficiary = options.beneficiaryName || '';
    
    let displayLabel = `PIN ${resolved.pincode} (${resolved.name})`;
    if (isFamily) {
      displayLabel += beneficiary ? ` • For ${beneficiary}` : ` • Family Booking`;
    }

    const updated = {
      mode: 'manual',
      label: displayLabel,
      pincode: resolved.pincode,
      name: resolved.name,
      district: resolved.district,
      lat: resolved.lat,
      lng: resolved.lng,
      status: 'acquired',
      isFamilyBooking: isFamily,
      beneficiaryName: beneficiary,
      note: options.note || ''
    };

    setLocationState(updated);
    saveLocation(updated);
    setGpsError(null);
    setIsPermissionBlocked(false);
    return updated;
  }, []);

  // Switch to Manual with an explicit Custom Location Object (e.g. from ORS Geocoder autocomplete)
  const setManualLocationCustom = useCallback((locationItem, options = {}) => {
    const isFamily = Boolean(options.isFamilyBooking);
    const beneficiary = options.beneficiaryName || '';
    
    let displayLabel = locationItem.name || 'Selected Location';
    if (isFamily) {
      displayLabel += beneficiary ? ` • For ${beneficiary}` : ` • Family Booking`;
    }

    const updated = {
      mode: 'manual',
      label: displayLabel,
      pincode: locationItem.pincode || '',
      name: locationItem.name || 'Custom Location',
      district: locationItem.district || 'Karnataka',
      locality: locationItem.locality || '',
      lat: Number(locationItem.lat),
      lng: Number(locationItem.lng),
      status: 'acquired',
      isFamilyBooking: isFamily,
      beneficiaryName: beneficiary,
      note: options.note || ''
    };

    setLocationState(updated);
    saveLocation(updated);
    setGpsError(null);
    setIsPermissionBlocked(false);
    return updated;
  }, []);

  // Quick Preset Selection (Tumakuru, Sira, Gubbi, etc.)
  const setPresetLocation = useCallback((presetId, options = {}) => {
    const preset = LOCATION_PRESETS.find(p => p.id === presetId) || LOCATION_PRESETS[0];
    return setManualLocationByPincode(preset.pin, {
      ...options,
      note: preset.detail
    });
  }, [setManualLocationByPincode]);

  const hasValidCoords = Boolean(locationState.lat && locationState.lng);

  const coords = useMemo(() => {
    return hasValidCoords
      ? { lat: Number(locationState.lat), lng: Number(locationState.lng) }
      : null;
  }, [hasValidCoords, locationState.lat, locationState.lng]);

  return {
    locationState,
    coords,
    hasCoords: hasValidCoords,
    mode: locationState.mode, // 'gps' | 'manual'
    isGPS: locationState.mode === 'gps',
    isFamilyBooking: Boolean(locationState.isFamilyBooking),
    label: locationState.label,
    isLocating,
    gpsError,
    gpsErrorCode,
    isPermissionBlocked,
    presets: LOCATION_PRESETS,
    hospitalCoords: HOSPITAL_COORDINATES,
    setLiveGPSMode,
    setManualLocationByPincode,
    setManualLocationCustom,
    setPresetLocation,
    detectLiveLocation: requestGPS,
    refreshGPS: requestGPS
  };
};


