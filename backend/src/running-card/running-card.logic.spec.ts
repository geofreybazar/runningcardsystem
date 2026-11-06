import { buildRunningCard, haversineKm } from './running-card.logic.js';

const rules = { stationsPerAlarm: 2, maxDistanceKm: 10, alarmLevels: ['1st Alarm', '2nd Alarm', '3rd Alarm'] };
const origin = { lat: 14.5916, lng: 121.0031 };
// Points due north of the origin, ~1.1 km apart.
const at = (km: number, name: string) => ({ name, lat: origin.lat + km / 111.2, lng: origin.lng });

describe('buildRunningCard', () => {
  it('orders by distance and groups per alarm level', () => {
    const card = buildRunningCard(origin, [at(3, 'c'), at(1, 'a'), at(4, 'd'), at(2, 'b'), at(5, 'e')], rules);
    expect(card.map((a) => a.alarmLevel)).toEqual(['1st Alarm', '2nd Alarm', '3rd Alarm']);
    expect(card.map((a) => a.stations.map((s) => s.name))).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
  });

  it('drops stations beyond the max distance and empty alarm levels', () => {
    const card = buildRunningCard(origin, [at(1, 'near'), at(50, 'far')], rules);
    expect(card).toHaveLength(1);
    expect(card[0].stations.map((s) => s.name)).toEqual(['near']);
  });

  it('stops after the last alarm level', () => {
    const many = Array.from({ length: 10 }, (_, i) => at(i * 0.5, `s${i}`));
    expect(buildRunningCard(origin, many, rules).flatMap((a) => a.stations)).toHaveLength(6);
  });

  it('computes km distances', () => {
    expect(haversineKm(origin, at(3, 'x'))).toBeCloseTo(3, 1);
  });
});
