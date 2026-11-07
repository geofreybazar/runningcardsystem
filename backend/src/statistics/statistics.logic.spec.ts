import { computeStatistics, csvCell, manilaDate, manilaDateTime, manilaRange, percentile, type StatIncident, type StatUnit } from './statistics.logic.js';

const LEVELS = ['1st Alarm', '2nd Alarm', '3rd Alarm'];
const caloocan = { name: 'Caloocan', district: { code: 2, name: 'Fire District 2', alias: 'CAMANAVA' } };
const manila = { name: 'Manila', district: { code: 1, name: 'Fire District 1', alias: null } };
const at = (iso: string) => new Date(iso);

const unit = (o: Partial<StatUnit> & { stationCityId?: number; stationId?: number; truckId?: number }): StatUnit => ({
  alarmLevel: '1st Alarm',
  dispatchedAt: at('2026-11-02T00:00:00Z'),
  releasedAt: null,
  station: { id: o.stationId ?? 1, name: `Station ${o.stationId ?? 1}`, cityId: o.stationCityId ?? 2, city: { name: o.stationCityId === 1 ? 'Manila' : 'Caloocan' } },
  truck: { id: o.truckId ?? 1, callSign: `E-${o.truckId ?? 1}` },
  ...o,
});

const incident = (o: Partial<StatIncident>): StatIncident => ({
  lat: 14.65,
  lng: 120.98,
  status: 'CLOSED',
  alarmIndex: 0,
  createdAt: at('2026-11-02T00:00:00Z'),
  closedAt: at('2026-11-02T01:00:00Z'),
  cityId: 2,
  city: caloocan,
  barangay: { name: 'Brgy. 1' },
  units: [unit({})],
  ...o,
});

describe('statistics logic', () => {
  it('Manila calendar: 23:30 UTC is the next day 07:30 in Manila', () => {
    expect(manilaDate(at('2026-11-01T23:30:00Z'))).toBe('2026-11-02');
    expect(manilaDateTime(at('2026-11-01T23:30:00Z'))).toBe('2026-11-02 07:30');
    const { start, end } = manilaRange('2026-11-02', '2026-11-02');
    expect(start.toISOString()).toBe('2026-11-01T16:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-02T16:00:00.000Z');
  });

  it('percentiles interpolate', () => {
    expect(percentile([], 0.5)).toBeNull();
    expect(percentile([10, 30, 20], 0.5)).toBe(20);
    expect(percentile([0, 10], 0.9)).toBe(9);
  });

  it('trend: continuous days, weekly (Mondays) past 90 days', () => {
    const s = computeStatistics([incident({ createdAt: at('2026-11-01T23:30:00Z') })], { from: '2026-11-01', to: '2026-11-03', alarmLevels: LEVELS });
    expect(s.trend).toEqual([
      { bucket: '2026-11-01', count: 0 },
      { bucket: '2026-11-02', count: 1 }, // Manila time
      { bucket: '2026-11-03', count: 0 },
    ]);
    const weekly = computeStatistics([incident({})], { from: '2026-08-01', to: '2026-11-08', alarmLevels: LEVELS });
    expect(weekly.range.bucket).toBe('week');
    expect(weekly.trend[0].bucket).toBe('2026-07-27'); // the Monday on or before Aug 1
    expect(weekly.trend.find((b) => b.bucket === '2026-11-02')!.count).toBe(1);
  });

  it('durations count closed incidents only; time to each alarm is from dispatch', () => {
    const raised = incident({
      alarmIndex: 1,
      closedAt: at('2026-11-02T03:00:00Z'), // 180 min
      units: [unit({}), unit({ alarmLevel: '2nd Alarm', dispatchedAt: at('2026-11-02T00:20:00Z'), stationId: 2, truckId: 2 })],
    });
    const open = incident({ status: 'OPEN', closedAt: null });
    const s = computeStatistics([incident({}), raised, open], { from: '2026-11-01', to: '2026-11-08', alarmLevels: LEVELS });
    expect(s.summary).toMatchObject({ incidents: 3, open: 1, closed: 2, medianDurationMin: 120 });
    expect(s.duration.histogram.map((b) => b.count)).toEqual([0, 0, 1, 1, 0]); // 60 min -> "1-2 h", 180 min -> "2-4 h"
    expect(s.duration.toAlarm).toEqual([{ level: '2nd Alarm', index: 1, minutes: 20, count: 1 }]);
    expect(s.byAlarm).toEqual([
      { level: '1st Alarm', index: 0, count: 2 },
      { level: '2nd Alarm', index: 1, count: 1 },
    ]);
  });

  it('mutual aid: a station sending a truck to another city', () => {
    const s = computeStatistics([incident({ cityId: 1, city: manila, units: [unit({ stationCityId: 2 }), unit({ stationCityId: 1, stationId: 3, truckId: 3 })] })], {
      from: '2026-11-01',
      to: '2026-11-08',
      alarmLevels: LEVELS,
    });
    expect(s.summary).toMatchObject({ unitsSent: 2, mutualAidUnits: 1 });
    expect(s.workload.mutualAid).toEqual(
      expect.arrayContaining([
        { name: 'Caloocan', sent: 1, received: 0 },
        { name: 'Manila', sent: 0, received: 1 },
      ]),
    );
  });

  it('responding hours are clipped to the range; open units count until now', () => {
    const u = unit({ dispatchedAt: at('2026-10-31T12:00:00Z'), releasedAt: at('2026-10-31T20:00:00Z') }); // range starts 2026-10-31T16:00Z: 4 h inside
    const s = computeStatistics([incident({ units: [u] })], { from: '2026-11-01', to: '2026-11-01', alarmLevels: LEVELS });
    expect(s.workload.trucks[0].hours).toBe(4);
    const still = computeStatistics([incident({ units: [unit({ dispatchedAt: at('2026-11-02T00:00:00Z') })] })], {
      from: '2026-11-01',
      to: '2026-11-08',
      alarmLevels: LEVELS,
      now: at('2026-11-02T02:30:00Z'),
    });
    expect(still.workload.trucks[0].hours).toBe(2.5);
  });

  it('weekday x hour grid in Manila time; top barangays', () => {
    // 2026-11-02 is a Monday; 01:00 UTC = 09:00 Manila.
    const s = computeStatistics([incident({ createdAt: at('2026-11-02T01:00:00Z') })], { from: '2026-11-01', to: '2026-11-08', alarmLevels: LEVELS });
    expect(s.when.grid[0][9]).toBe(1);
    expect(s.when.barangays).toEqual([{ name: 'Brgy. 1, Caloocan', count: 1 }]);
  });

  it('CSV cells are quoted and never start a formula', () => {
    expect(csvCell('Tondo, "north"')).toBe('"Tondo, ""north"""');
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('-5')).toBe(`"'-5"`);
    expect(csvCell(null)).toBe('""');
  });
});
