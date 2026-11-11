import { buildRunningCard, haversineKm, nearestFirst, withinStraightLine } from './running-card.logic.js';

const rules = { stationsPerAlarm: 2, maxDistanceKm: 10, alarmLevels: ['1st Alarm', '2nd Alarm', '3rd Alarm'] };
const origin = { lat: 14.5916, lng: 121.0031 };
// Points due north of the origin, ~1.1 km apart.
const at = (km: number, name: string) => ({ name, lat: origin.lat + km / 111.2, lng: origin.lng });
const by = (distance: number, name: string) => ({ name, distance });

describe('buildRunningCard', () => {
  it('orders by distance and groups per alarm level', () => {
    const card = buildRunningCard([by(3, 'c'), by(1, 'a'), by(4, 'd'), by(2, 'b'), by(5, 'e')], rules);
    expect(card.map((a) => a.alarmLevel)).toEqual(['1st Alarm', '2nd Alarm', '3rd Alarm']);
    expect(card.map((a) => a.stations.map((s) => s.name))).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
  });

  it('drops stations beyond the max distance and empty alarm levels', () => {
    const card = buildRunningCard([by(1, 'near'), by(50, 'far')], rules);
    expect(card).toHaveLength(1);
    expect(card[0].stations.map((s) => s.name)).toEqual(['near']);
  });

  it('stops after the last alarm level', () => {
    const many = Array.from({ length: 10 }, (_, i) => by(i * 0.5, `s${i}`));
    expect(buildRunningCard(many, rules).flatMap((a) => a.stations)).toHaveLength(6);
  });

  it('ranks by the road distance given, not by position', () => {
    // "across" is nearer in a straight line but 9 km away by road (e.g. across the river); "around" is the one that goes.
    const across = { ...at(1, 'across'), distance: 9 };
    const around = { ...at(3, 'around'), distance: 4 };
    expect(nearestFirst([across, around], 10).map((s) => s.name)).toEqual(['around', 'across']);
  });
});

describe('distances', () => {
  it('computes straight-line km', () => {
    expect(haversineKm(origin, at(3, 'x'))).toBeCloseTo(3, 1);
  });

  it('pre-filters by straight line', () => {
    expect(withinStraightLine(origin, [at(1, 'in'), at(12, 'out')], 10).map((s) => s.name)).toEqual(['in']);
  });
});
