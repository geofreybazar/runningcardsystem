/** Pure running-card rules, ported from the original frontend `variables.js`. */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CardRules {
  stationsPerAlarm: number;
  maxDistanceKm: number;
  alarmLevels: string[];
}

export const haversineKm = (a: LatLng, b: LatLng) => {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

/**
 * Nearest stations first, grouped `stationsPerAlarm` per alarm level, one group per entry in `alarmLevels`.
 * Callers pass only stations that can respond (active, with an available truck).
 */
export function buildRunningCard<S extends LatLng>(origin: LatLng, stations: S[], rules: CardRules) {
  const ranked = stations
    .map((s) => ({ ...s, distance: haversineKm(origin, s) }))
    .filter((s) => s.distance <= rules.maxDistanceKm)
    .sort((a, b) => a.distance - b.distance);
  return rules.alarmLevels
    .map((alarmLevel, i) => ({
      alarmLevel,
      stations: ranked.slice(i * rules.stationsPerAlarm, (i + 1) * rules.stationsPerAlarm),
    }))
    .filter((alarm) => alarm.stations.length > 0);
}
