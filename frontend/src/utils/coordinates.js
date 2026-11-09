import { NCR_BOUNDS } from "../constants/map.js"; // relative: node --test has no @/ alias

// Accepts "14.59, 121.00", "14.59,121.00" or "14.59 121.00". Returns null for anything else or outside NCR.
export const parseCoordinates = (text) => {
  const m = String(text).trim().match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  const { south, west, north, east } = NCR_BOUNDS;
  if (lat < south || lat > north || lng < west || lng > east) return null;
  return { lat, lng };
};

// Opens the point in Google Maps (the app on phones). No API key: the public Maps URL scheme.
export const googleMapsUrl = ({ lat, lng }) =>
  `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
