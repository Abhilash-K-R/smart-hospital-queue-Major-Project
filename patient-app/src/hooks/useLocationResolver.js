import { useState, useEffect, useCallback } from 'react';
import {
  getSavedLocation,
  saveLocation,
  resolvePincode,
  LOCATION_PRESETS,
  HOSPITAL_COORDINATES
} from '../utils/locationResolver';

/**
 * Custom hook for Dual-Mode Location Handling:
 * Mode A: Live GPS (navigator.geolocation)
 * Mode B: Manual / Family Booking Mode (6-Digit PIN or Preset Selection)
 */
export const useLocationResolver = () => {
  const [locationState, setLocationState] = useState(getSavedLocation);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Request real device GPS
  const requestGPS = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6))
        };
        setGpsCoords(coords);
        setIsLocating(false);

        // If currently in GPS mode, update active location state
        if (locationState.mode === 'gps') {
          const updated = {
            mode: 'gps',
            label: 'Live GPS (Current Location)',
            name: 'Device Current Coordinates',
            pincode: '',
            lat: coords.lat,
            lng: coords.lng,
            isFamilyBooking: false,
            beneficiaryName: ''
          };
          setLocationState(updated);
          saveLocation(updated);
        }
      },
      (err) => {
        setIsLocating(false);
        setGpsError(err.message || 'Unable to retrieve your current location.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, [locationState.mode]);

  // Initial GPS lookup on mount if in GPS mode
  useEffect(() => {
    if (locationState.mode === 'gps') {
      requestGPS();
    }
  }, [locationState.mode, requestGPS]);

  // Switch to Live GPS Mode
  const setLiveGPSMode = useCallback(() => {
    setIsLocating(true);
    if (gpsCoords) {
      const updated = {
        mode: 'gps',
        label: 'Live GPS (Current Location)',
        name: 'Device Current Coordinates',
        pincode: '',
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
        isFamilyBooking: false,
        beneficiaryName: ''
      };
      setLocationState(updated);
      saveLocation(updated);
      setIsLocating(false);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6))
          };
          setGpsCoords(coords);
          const updated = {
            mode: 'gps',
            label: 'Live GPS (Current Location)',
            name: 'Device Current Coordinates',
            pincode: '',
            lat: coords.lat,
            lng: coords.lng,
            isFamilyBooking: false,
            beneficiaryName: ''
          };
          setLocationState(updated);
          saveLocation(updated);
          setIsLocating(false);
        },
        () => {
          // Fallback if blocked
          const updated = {
            mode: 'gps',
            label: 'Live GPS (Tumakuru South)',
            name: 'Tumakuru Default Location',
            pincode: '',
            lat: 13.340881,
            lng: 77.100601,
            isFamilyBooking: false,
            beneficiaryName: ''
          };
          setLocationState(updated);
          saveLocation(updated);
          setIsLocating(false);
        },
        { timeout: 6000 }
      );
    }
  }, [gpsCoords]);

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
      isFamilyBooking: isFamily,
      beneficiaryName: beneficiary,
      note: options.note || ''
    };

    setLocationState(updated);
    saveLocation(updated);
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

  return {
    locationState,
    coords: {
      lat: locationState.lat || 13.340881,
      lng: locationState.lng || 77.100601
    },
    mode: locationState.mode, // 'gps' | 'manual'
    isGPS: locationState.mode === 'gps',
    isFamilyBooking: Boolean(locationState.isFamilyBooking),
    label: locationState.label,
    isLocating,
    gpsError,
    presets: LOCATION_PRESETS,
    hospitalCoords: HOSPITAL_COORDINATES,
    setLiveGPSMode,
    setManualLocationByPincode,
    setPresetLocation,
    refreshGPS: requestGPS
  };
};
