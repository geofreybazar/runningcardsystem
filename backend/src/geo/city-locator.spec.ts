import { readFileSync } from 'node:fs';
import { locateCity, pointInRing, type CityShape } from './city-locator.js';

const shapes: CityShape[] = JSON.parse(
  readFileSync(new URL('../../prisma/seed-data/ncr-city-boundaries.json', import.meta.url), 'utf8'),
).cities;
const stations: { name: string; lat: number; lng: number; districtCode: number }[] = JSON.parse(
  readFileSync(new URL('../../prisma/seed-data/stations.json', import.meta.url), 'utf8'),
);

const DISTRICT_CITIES: Record<number, string[]> = {
  1: ['Manila'],
  2: ['Caloocan', 'Malabon', 'Navotas', 'Valenzuela'],
  3: ['Pasay', 'Makati', 'Las Piñas', 'Parañaque', 'Muntinlupa'],
  4: ['Marikina', 'Pasig', 'Pateros', 'Taguig', 'Mandaluyong', 'San Juan'],
  5: ['Quezon City'],
};

describe('locateCity', () => {
  it('ray casting on a square', () => {
    const square: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
    expect(pointInRing(0.5, 0.5, square)).toBe(true);
    expect(pointInRing(1.5, 0.5, square)).toBe(false);
  });

  it('finds well-known places', () => {
    expect(locateCity(shapes, 14.5995, 120.9842)).toBe('Manila'); // Quiapo
    expect(locateCity(shapes, 14.6507, 121.0494)).toBe('Quezon City'); // Quezon Memorial Circle
    expect(locateCity(shapes, 14.6573, 120.9839)).toBe('Caloocan'); // Monumento
    expect(locateCity(shapes, 14.5547, 121.0244)).toBe('Makati'); // Ayala Triangle
    expect(locateCity(shapes, 14.5764, 121.0851)).toBe('Pasig'); // Ortigas/Pasig city hall area
  });

  it('returns null well outside NCR', () => {
    expect(locateCity(shapes, 14.2956, 120.9583)).toBeNull(); // Dasmariñas, Cavite
  });

  it('puts every seeded station in a city of its own fire district', () => {
    const wrong = stations
      .map((s) => ({ ...s, city: locateCity(shapes, s.lat, s.lng) }))
      .filter((s) => !s.city || !DISTRICT_CITIES[s.districtCode].includes(s.city));
    expect(wrong.map((s) => `${s.name} (FD${s.districtCode}) → ${s.city}`)).toEqual([]);
  });
});
