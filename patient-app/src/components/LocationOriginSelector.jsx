import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Users,
  Compass,
  Check,
  Search,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';
import { resolvePincode, LOCATION_PRESETS, PINCODE_DATABASE, cleanseLocationName } from '../utils/locationResolver';

/**
 * Dual-Mode Location Origin Selector Modal / Card
 * Enables seamless switching between Live GPS and Manual / Family Booking (Pincode, City/Town Autocomplete, or Preset).
 */
export const LocationOriginSelector = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectGPS,
  onSelectManual,
  isLocating
}) => {
  const [activeTab, setActiveTab] = useState(currentLocation?.mode === 'manual' ? 'manual' : 'gps');
  const [searchInput, setSearchInput] = useState(() => cleanseLocationName(currentLocation?.pincode || currentLocation?.name || ''));
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [resolvedPreview, setResolvedPreview] = useState(() => 
    currentLocation?.pincode ? resolvePincode(currentLocation.pincode) : null
  );
  const [isFamilyBooking, setIsFamilyBooking] = useState(Boolean(currentLocation?.isFamilyBooking));
  const [beneficiaryName, setBeneficiaryName] = useState(currentLocation?.beneficiaryName || '');
  
  // GPS State inside modal
  const [gpsData, setGpsData] = useState(() => {
    if (currentLocation?.mode === 'gps' && currentLocation?.lat && currentLocation?.lng) {
      return {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        name: cleanseLocationName(currentLocation.name) || 'Live Location'
      };
    }
    return null;
  });
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  // Autocomplete state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(currentLocation?.mode === 'manual' ? 'manual' : 'gps');
      setSearchInput(cleanseLocationName(currentLocation?.pincode || currentLocation?.name || ''));
      setIsFamilyBooking(Boolean(currentLocation?.isFamilyBooking));
      setBeneficiaryName(currentLocation?.beneficiaryName || '');
      setShowDropdown(false);
      setSearchResults([]);
      isSelectingRef.current = false;
      if (currentLocation?.mode === 'gps' && currentLocation?.lat && currentLocation?.lng) {
        setGpsData({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          name: cleanseLocationName(currentLocation.name) || 'Live Location'
        });
      } else {
        setGpsData(null);
      }
    }
  }, [isOpen, currentLocation]);

  const handleRedetectGPS = () => {
    if (!('geolocation' in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const resp = await fetch(`${backendUrl}/geocode/reverse?lat=${latitude}&lng=${longitude}`);
          let placeName = `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.formatted_address) {
              placeName = data.formatted_address;
            }
          }
          const acquired = {
            lat: latitude,
            lng: longitude,
            name: placeName
          };
          setGpsData(acquired);
          setSelectedLocation({
            mode: 'gps',
            lat: latitude,
            lng: longitude,
            name: placeName,
            status: 'acquired'
          });
        } catch (err) {
          setGpsData({
            lat: latitude,
            lng: longitude,
            name: `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          });
        } finally {
          setIsDetectingGPS(false);
        }
      },
      (err) => {
        setIsDetectingGPS(false);
        alert(`GPS failed: ${err.message || 'Position unavailable'}`);
        setGpsData(null);
        setSelectedLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Debounced search for place name / PIN
  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const clean = cleanseLocationName(searchInput).trim();
    if (!clean || clean.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    // Check offline pincode DB for immediate feedback
    if (PINCODE_DATABASE[clean]) {
      const pinObj = {
        name: cleanseLocationName(PINCODE_DATABASE[clean].name),
        locality: PINCODE_DATABASE[clean].tag || PINCODE_DATABASE[clean].name,
        district: PINCODE_DATABASE[clean].district,
        lat: PINCODE_DATABASE[clean].lat,
        lng: PINCODE_DATABASE[clean].lng,
        pincode: clean,
        isEstimated: false
      };
      setSearchResults([pinObj]);
      setResolvedPreview(pinObj);
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const resp = await fetch(`${backendUrl}/geocode?query=${encodeURIComponent(clean)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.results && data.results.length > 0) {
            setSearchResults(data.results.map(r => ({
              ...r,
              name: cleanseLocationName(r.name)
            })));
            setShowDropdown(true);
          } else if (data && data.success) {
            setSearchResults([{
              name: cleanseLocationName(data.name),
              locality: data.district,
              district: data.district,
              lat: data.lat,
              lng: data.lng,
              isEstimated: data.isEstimated
            }]);
            setShowDropdown(true);
          }
        }
      } catch (err) {
        console.warn("Autocomplete search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  if (!isOpen) return null;

  const handleSelectResult = (item) => {
    isSelectingRef.current = true;
    const cleanName = cleanseLocationName(item.name);
    const cleanedItem = { ...item, name: cleanName };
    setSelectedLocation(cleanedItem);
    setSearchInput(cleanName);
    setResolvedPreview(cleanedItem);
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handlePresetClick = (preset) => {
    isSelectingRef.current = true;
    const cleanName = cleanseLocationName(preset.name);
    setSearchInput(cleanName);
    const item = {
      name: cleanName,
      locality: preset.tag || cleanName,
      district: preset.district,
      lat: preset.lat,
      lng: preset.lng,
      pincode: preset.pin,
      isEstimated: false
    };
    setSelectedLocation(item);
    setResolvedPreview(item);
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleApply = () => {
    if (activeTab === 'gps') {
      if (gpsData && gpsData.lat && gpsData.lng) {
        onSelectManual('', { isFamilyBooking: false, beneficiaryName: '' }, {
          mode: 'gps',
          label: `Live GPS (${gpsData.name})`,
          name: gpsData.name,
          lat: gpsData.lat,
          lng: gpsData.lng,
          status: 'acquired',
          isFamilyBooking: false
        });
      } else {
        onSelectGPS();
      }
      onClose();
    } else {
      const locationItem = selectedLocation || resolvedPreview || resolvePincode(searchInput || '572101');
      onSelectManual(locationItem.pincode || locationItem.name, {
        isFamilyBooking,
        beneficiaryName: beneficiaryName.trim()
      }, locationItem);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Departure Origin Setting
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Where is the patient departing from?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('gps')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'gps'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Live GPS (Current Device)
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Family / Remote Pincode
          </button>
        </div>

        {/* Tab 1: Live GPS */}
        {activeTab === 'gps' && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Navigation className="w-4 h-4 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Device Geolocation (Mode A)
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Continuously calculates real-time commute distance to Shridevi Hospital from your smartphone / browser GPS.
                  </p>
                </div>
              </div>

              {isDetectingGPS || isLocating ? (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium p-2.5 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-blue-200 dark:border-blue-800">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Acquiring live satellite coordinates (fresh fix)...
                </div>
              ) : (gpsData?.lat && gpsData?.lng) || (currentLocation?.lat && currentLocation?.lng) ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {gpsData?.name || currentLocation?.name || 'Live Location'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Lat: {Number(gpsData?.lat || currentLocation?.lat).toFixed(4)} | Lng: {Number(gpsData?.lng || currentLocation?.lng).toFixed(4)}
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  </div>
                  <button
                    type="button"
                    onClick={handleRedetectGPS}
                    className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Re-detect Live Location
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">
                        No GPS Location Detected. Click 'Re-detect Live Location' below.
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Lat: -- | Lng: --
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRedetectGPS}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Navigation className="w-4 h-4" /> Re-detect Live Location
                  </button>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Tab 2: Manual / Family Pincode Mode */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            
            {/* Family Booking Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Booking for Someone Else?
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Patient is at home or in another town
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFamilyBooking}
                  onChange={(e) => setIsFamilyBooking(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Beneficiary Name (if family booking) */}
            {isFamilyBooking && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Patient / Beneficiary Label
                </label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="e.g. Mother, Grandparent, Friend in Sira"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* Live Autocomplete Search Input */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Origin Place Name or 6-Digit PIN Code
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  placeholder="Type PIN (572137) or place (Davanagere, Sira, Peenya)..."
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-2.5 text-blue-500 animate-spin" />
                )}
              </div>

              {/* Dynamic Autocomplete Suggestions Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectResult(item)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700/70 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {item.district} District • Coordinates: {Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md shrink-0">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Resolved Location Preview Box */}
            {resolvedPreview && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      {resolvedPreview.name}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      {resolvedPreview.district} District • Coordinates: {Number(resolvedPreview.lat).toFixed(4)}, {Number(resolvedPreview.lng).toFixed(4)}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md">
                  {resolvedPreview.isEstimated ? 'Regional' : 'Verified'}
                </span>
              </div>
            )}

            {/* Quick Presets */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" /> Quick Regional Presets
              </p>
              <div className="flex flex-wrap gap-1.5">
                {LOCATION_PRESETS.map((preset) => {
                  const isSelected = searchInput === preset.pin || searchInput === preset.name;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{preset.label}</span>
                      <span className="text-[10px] opacity-75 font-mono">({preset.pin})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Location Origin
          </button>
        </div>

      </div>
    </div>
  );
};

export default LocationOriginSelector;

