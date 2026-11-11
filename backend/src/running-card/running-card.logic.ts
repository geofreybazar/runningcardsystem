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
 * Stations within `maxKm` in a straight line. A road is never shorter than the straight line, so this drops no station
 * that is within `maxKm` by road; it only keeps the routing request small.
 */
export const withinStraightLine = <S extends LatLng>(origin: LatLng, stations: S[], maxKm: number) =>
  stations.filter((s) => haversineKm(origin, s) <= maxKm);

/** Within `maxKm`, nearest first, by the distance already on each station (road km, or straight line as a fallback). */
export const nearestFirst = <S extends { distance: number }>(stations: S[], maxKm: number) =>
  stations.filter((s) => s.distance <= maxKm).sort((a, b) => a.distance - b.distance);

/**
 * Nearest stations first, grouped `stationsPerAlarm` per alarm level, one group per entry in `alarmLevels`.
 * Callers pass only stations that can respond (active, with an available truck), each with its distance to the fire.
 */
export function buildRunningCard<S extends { distance: number }>(stations: S[], rules: CardRules) {
  const ranked = nearestFirst(stations, rules.maxDistanceKm);
  return rules.alarmLevels
    .map((alarmLevel, i) => ({
      alarmLevel,
      stations: ranked.slice(i * rules.stationsPerAlarm, (i + 1) * rules.stationsPerAlarm),
    }))
    .filter((alarm) => alarm.stations.length > 0);
}
