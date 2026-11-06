/** Which NCR city a point is in, from barangay outlines grouped per city (see prisma/seed-data/ncr-city-boundaries.json). */

export type Ring = [number, number][]; // [lng, lat]

export interface CityShape {
  name: string;
  bbox: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
  rings: Ring[];
}

/** Ray casting. */
export function pointInRing(lng: number, lat: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const KM_PER_DEG_LAT = 111.32;

/** Distance in km from a point to a segment, on a local flat projection (fine at city scale). */
function segmentKm(lng: number, lat: number, [ax, ay]: [number, number], [bx, by]: [number, number]) {
  const kx = KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
  const px = (lng - ax) * kx, py = (lat - ay) * KM_PER_DEG_LAT;
  const dx = (bx - ax) * kx, dy = (by - ay) * KM_PER_DEG_LAT;
  const t = dx || dy ? Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(px - t * dx, py - t * dy);
}

/**
 * The city containing the point; otherwise the nearest city within `toleranceKm`
 * (simplified outlines leave slivers along rivers, shorelines and borders); otherwise null (outside NCR).
 */
export function locateCity(shapes: CityShape[], lat: number, lng: number, toleranceKm = 1): string | null {
  for (const c of shapes) {
    const [x0, y0, x1, y1] = c.bbox;
    if (lng < x0 || lng > x1 || lat < y0 || lat > y1) continue;
    if (c.rings.some((r) => pointInRing(lng, lat, r))) return c.name;
  }
  let best: { name: string; km: number } | null = null;
  for (const c of shapes) {
    for (const r of c.rings) {
      for (let i = 1; i < r.length; i++) {
        const km = segmentKm(lng, lat, r[i - 1], r[i]);
        if (km <= toleranceKm && (!best || km < best.km)) best = { name: c.name, km };
      }
    }
  }
  return best?.name ?? null;
}
