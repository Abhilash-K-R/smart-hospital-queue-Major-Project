/**
 * Location Resolver & Offline Geocoding Database for Shridevi MediFlow
 * Supports Live GPS detection & Dual-Mode Pincode / Locality resolution
 * for Tumakuru district, Bangalore, and Karnataka regions.
 */

// Hospital Coordinates: Shridevi Hospital & Research Hospital, Sira Road, Tumakuru
export const HOSPITAL_COORDINATES = {
  lat: 13.376230,
  lng: 77.097439,
  name: "Shridevi Hospital & Research Hospital, Tumakuru",
  address: "Sira Road, Tumakuru, Karnataka 572106"
};

// Comprehensive Regional Pincode & Locality Mapping
export const PINCODE_DATABASE = {
  // Tumakuru City & Local Areas
  "572101": { name: "Tumakuru Town (B.H. Road / Mandipet)", lat: 13.3409, lng: 77.1010, district: "Tumakuru", tag: "Tumakuru Central" },
  "572102": { name: "Tumakuru SSMC / Heggere / Maralur", lat: 13.3167, lng: 77.0833, district: "Tumakuru", tag: "Tumakuru West" },
  "572103": { name: "Tumakuru University / Batwadi", lat: 13.3370, lng: 77.1180, district: "Tumakuru", tag: "Tumakuru East" },
  "572104": { name: "Tumakuru Kyatsandra / Siddaganga Math", lat: 13.3150, lng: 77.1520, district: "Tumakuru", tag: "Kyatsandra" },
  "572105": { name: "Tumakuru SIT Extension / Ring Road", lat: 13.3280, lng: 77.1260, district: "Tumakuru", tag: "SIT Campus" },
  "572106": { name: "SIET Campus / Sira Road", lat: 13.3792, lng: 77.1004, district: "Tumakuru", tag: "Near Campus" },

  // Tumakuru District Taluks
  "572137": { name: "Sira Town & Taluk", lat: 13.7434, lng: 76.9048, district: "Tumakuru", tag: "Sira" },
  "572216": { name: "Gubbi Town & Taluk", lat: 13.3111, lng: 76.9405, district: "Tumakuru", tag: "Gubbi" },
  "572130": { name: "Kunigal Town & National Highway", lat: 13.0238, lng: 77.0345, district: "Tumakuru", tag: "Kunigal" },
  "572201": { name: "Tiptur Town (Kalpataru City)", lat: 13.2555, lng: 76.4784, district: "Tumakuru", tag: "Tiptur" },
  "572138": { name: "Madhugiri Monolith Area", lat: 13.6631, lng: 77.2089, district: "Tumakuru", tag: "Madhugiri" },
  "572129": { name: "Koratagere Town & Taluk", lat: 13.5233, lng: 77.2378, district: "Tumakuru", tag: "Koratagere" },
  "572220": { name: "Turuvekere Town", lat: 13.1611, lng: 76.6681, district: "Tumakuru", tag: "Turuvekere" },
  "572128": { name: "Pavagada Taluk", lat: 14.1011, lng: 77.2789, district: "Tumakuru", tag: "Pavagada" },
  "572214": { name: "Chikkanayakanahalli", lat: 13.4192, lng: 76.6214, district: "Tumakuru", tag: "C.N. Halli" },

  // Greater Bengaluru Metropolitan Areas
  "560023": { name: "Bengaluru Majestic / City Center", lat: 12.9767, lng: 77.5713, district: "Bengaluru Urban", tag: "Majestic / KSR" },
  "560057": { name: "Bengaluru Peenya Industrial / Yeshwanthpur", lat: 13.0285, lng: 77.5197, district: "Bengaluru Urban", tag: "Peenya / Metro" },
  "562123": { name: "Nelamangala Highway Junction", lat: 13.0975, lng: 77.3916, district: "Bengaluru Rural", tag: "Nelamangala Toll" },
  "560064": { name: "Yelahanka / North Bengaluru", lat: 13.1007, lng: 77.5963, district: "Bengaluru Urban", tag: "Yelahanka" },
  "562159": { name: "Doddaballapura Town", lat: 13.2929, lng: 77.5413, district: "Bengaluru Rural", tag: "Doddaballapura" },

  // Central Karnataka / Davanagere & Chitradurga Region
  "577002": { name: "Davanagere City / PB Road", lat: 14.4644, lng: 75.9218, district: "Davanagere", tag: "Davanagere Central" },
  "577001": { name: "Davanagere Main / Gandhi Circle", lat: 14.4589, lng: 75.9192, district: "Davanagere", tag: "Davanagere Main" },
  "577004": { name: "Davanagere Vidyanagar / MCC", lat: 14.4750, lng: 75.9320, district: "Davanagere", tag: "Vidyanagar" },
  "577005": { name: "Davanagere Industrial Area", lat: 14.4820, lng: 75.9080, district: "Davanagere", tag: "Industrial Area" },
  "577525": { name: "Holalkere / Chitradurga Region", lat: 14.0322, lng: 76.1843, district: "Chitradurga", tag: "Holalkere" },
  "577501": { name: "Chitradurga Fort City", lat: 14.2251, lng: 76.3980, district: "Chitradurga", tag: "Chitradurga" },
  "577533": { name: "Hosadurga Town", lat: 13.7997, lng: 76.2863, district: "Chitradurga", tag: "Hosadurga" },
  "577544": { name: "Hiriyur Town & Highway", lat: 13.9554, lng: 76.6186, district: "Chitradurga", tag: "Hiriyur" },
  "577527": { name: "Jagalur Town", lat: 14.5204, lng: 76.3475, district: "Davanagere", tag: "Jagalur" },
  "577522": { name: "Channagiri Town", lat: 14.0267, lng: 75.9312, district: "Davanagere", tag: "Channagiri" },
  "577201": { name: "Shivamogga City Center", lat: 13.9299, lng: 75.5681, district: "Shivamogga", tag: "Shivamogga" },
  "577101": { name: "Chikkamagaluru Town", lat: 13.3161, lng: 75.7720, district: "Chikkamagaluru", tag: "Chikkamagaluru" }
};

// Popular 1-Click Presets for Quick Patient Selection & Demonstration Tiers
export const LOCATION_PRESETS = [
  { id: 'davanagere_city', label: 'Davanagere City (Far Tier)', pin: '577002', detail: 'Davanagere (~140-180 mins)', ...PINCODE_DATABASE['577002'] },
  { id: 'siet_campus', label: 'SIET Campus (Near)', pin: '572106', detail: 'Near Campus (~2 mins)', ...PINCODE_DATABASE['572106'] },
  { id: 'tumakuru_city', label: 'Tumakuru Town (Medium)', pin: '572101', detail: 'Central Town (~12-15 mins)', ...PINCODE_DATABASE['572101'] },
  { id: 'bengaluru_majestic', label: 'Bengaluru Majestic (Far)', pin: '560023', detail: 'City Center (~85-110 mins)', ...PINCODE_DATABASE['560023'] },
  { id: 'sira_town', label: 'Sira', pin: '572137', detail: 'Sira Taluk (~45 mins)', ...PINCODE_DATABASE['572137'] },
  { id: 'gubbi_town', label: 'Gubbi', pin: '572216', detail: 'Gubbi Rural (~25 mins)', ...PINCODE_DATABASE['572216'] },
  { id: 'koratagere_town', label: 'Koratagere', pin: '572129', detail: 'Koratagere Taluk (~35 mins)', ...PINCODE_DATABASE['572129'] }
];

/**
 * Cleanse location string to remove repetitive 'Location (' or 'Live Location (' wrappers.
 */
export const cleanseLocationName = (str = '') => {
  if (!str) return '';
  let cleaned = String(str).trim();
  // Strip nested Location ( ... ) or Live Location ( ... ) wrappers recursively
  while (/^(?:Location|Live Location|GPS Location|Current Location)\s*\((.*)\)$/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(?:Location|Live Location|GPS Location|Current Location)\s*\((.*)\)$/i, '$1').trim();
  }
  return cleaned;
};

/**
 * Resolves a 6-digit postal pincode to GPS coordinates
 * @param {string} pincode 
 * @returns {{ success: boolean, name: string, lat: number, lng: number, district: string, isEstimated: boolean }}
 */
export const resolvePincode = (pincode) => {
  const cleanPin = String(pincode || "").trim();
  if (!cleanPin) {
    return {
      success: false,
      pincode: "",
      name: "No Location Specified",
      lat: null,
      lng: null,
      district: "",
      isEstimated: false
    };
  }
  
  if (PINCODE_DATABASE[cleanPin]) {
    return {
      success: true,
      pincode: cleanPin,
      isEstimated: false,
      ...PINCODE_DATABASE[cleanPin]
    };
  }

  // Smart regional fallback heuristics for Karnataka pincodes
  if (cleanPin.startsWith("572")) {
    // Tumakuru district general fallback
    return {
      success: true,
      pincode: cleanPin,
      name: `Tumakuru District Region (${cleanPin})`,
      lat: 13.3409,
      lng: 77.1010,
      district: "Tumakuru",
      isEstimated: true
    };
  } else if (cleanPin.startsWith("560") || cleanPin.startsWith("562")) {
    // Bengaluru urban/rural general fallback
    return {
      success: true,
      pincode: cleanPin,
      name: `Bengaluru Region (${cleanPin})`,
      lat: 13.0285,
      lng: 77.5197,
      district: "Bengaluru",
      isEstimated: true
    };
  } else if (cleanPin.startsWith("577")) {
    // Chitradurga / Davanagere region
    return {
      success: true,
      pincode: cleanPin,
      name: `Central Karnataka Region (${cleanPin})`,
      lat: 14.2285,
      lng: 76.3992,
      district: "Chitradurga",
      isEstimated: true
    };
  }

  // Default fallback to Tumakuru South if unknown PIN
  return {
    success: false,
    pincode: cleanPin,
    name: cleanPin ? `Location (PIN ${cleanPin})` : "Tumakuru South (Default)",
    lat: 13.340881,
    lng: 77.100601,
    district: "Tumakuru",
    isEstimated: true
  };
};

// Storage helper to persist patient's chosen origin
const STORAGE_KEY = "mediflow_origin_location";

export const getSavedLocation = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.mode === 'manual' && parsed.lat && parsed.lng) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return {
    mode: "gps", // 'gps' | 'manual'
    label: "Live GPS (Not Detected)",
    pincode: "",
    name: "Current Device Location",
    lat: null,
    lng: null,
    status: "prompt_needed",
    isFamilyBooking: false,
    beneficiaryName: ""
  };
};

export const saveLocation = (locationData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locationData));
  } catch (err) {
    console.warn("Failed to persist location preference:", err);
  }
};


/**
 * Calls backend GET /geocode to resolve real coordinates via OpenRouteService Pelias
 * with local fallback on error or offline mode.
 */
export const geocodeLocationQuery = async (query) => {
  const clean = String(query || "").trim();
  if (!clean) return resolvePincode("572101");

  // Check known local pincode database first for instant 0ms resolution
  if (PINCODE_DATABASE[clean]) {
    return resolvePincode(clean);
  }

  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const resp = await fetch(`${backendUrl}/geocode?query=${encodeURIComponent(clean)}`);
    if (resp.ok) {
      const res = await resp.json();
      if (res && res.success && res.lat && res.lng) {
        return {
          success: true,
          pincode: clean.length === 6 && /^\d+$/.test(clean) ? clean : "",
          name: res.name || clean,
          lat: Number(res.lat),
          lng: Number(res.lng),
          district: res.district || "Karnataka",
          isEstimated: Boolean(res.isEstimated),
          source: res.source || "openrouteservice",
          results: res.results || []
        };
      }
    }
  } catch (err) {
    console.warn("Live /geocode request failed, using regional fallback:", err.message);
  }

  return resolvePincode(clean);
};

/**
 * Calls backend GET /geocode/reverse to reverse-geocode GPS coordinates into human-readable place name
 */
export const reverseGeocodeCoords = async (lat, lng) => {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const resp = await fetch(`${backendUrl}/geocode/reverse?lat=${lat}&lng=${lng}`);
    if (resp.ok) {
      const res = await resp.json();
      if (res && res.success) {
        return res;
      }
    }
  } catch (err) {
    console.warn("Reverse geocode request failed, using coordinates fallback:", err.message);
  }

  return {
    success: true,
    formatted_address: `GPS Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
    locality: "Tumakuru Vicinity",
    district: "Tumakuru",
    lat,
    lng
  };
};


