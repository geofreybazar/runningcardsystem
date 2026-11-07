/**
 * Statistics over a set of incidents, as a pure function (unit-tested in statistics.logic.spec.ts).
 * All calendar buckets are in Manila time (UTC+8, no daylight saving).
 * shortcut: aggregates in memory; fine for thousands of incidents a year; move to SQL GROUP BY if volume grows.
 */

const MANILA_OFFSET_MS = 8 * 3_600_000;
const DAY_MS = 86_400_000;
export const MAX_POINTS = 2000;

export type StatUnit = {
  alarmLevel: string;
  dispatchedAt: Date;
  releasedAt: Date | null;
  station: { id: number; name: string; cityId: number | null; city: { name: string } | null };
  truck: { id: number; callSign: string };
};

export type StatIncident = {
  lat: number;
  lng: number;
  status: 'OPEN' | 'CLOSED';
  alarmIndex: number;
  createdAt: Date;
  closedAt: Date | null;
  cityId: number | null;
  city: { name: string; district: { code: number; name: string; alias: string | null } } | null;
  barangay: { name: string } | null;
  units: StatUnit[];
};

/** A Manila calendar range: [start, end) in UTC instants, from two Manila dates (YYYY-MM-DD, inclusive). */
export function manilaRange(from: string, to: string) {
  const start = new Date(`${from}T00:00:00+08:00`);
  const end = new Date(new Date(`${to}T00:00:00+08:00`).getTime() + DAY_MS);
  return { start, end };
}

/** Today's date in Manila (YYYY-MM-DD). */
export const manilaToday = (now = new Date()) => manilaDate(now);

/** The Manila calendar date of an instant (YYYY-MM-DD). */
export const manilaDate = (d: Date) => new Date(d.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10);

/** Days added to a YYYY-MM-DD date. */
export const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** Manila weekday (0 = Monday … 6 = Sunday) and hour (0-23). */
function manilaWeekdayHour(d: Date) {
  const local = new Date(d.getTime() + MANILA_OFFSET_MS);
  return { weekday: (local.getUTCDay() + 6) % 7, hour: local.getUTCHours() };
}

/** Monday of the Manila week containing this date. */
const weekStart = (date: string) => addDays(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7));

/** Linear-interpolated percentile (p in 0..1) of numbers; null for none. */
export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  return sorted[lo] + (sorted[Math.ceil(i)] - sorted[lo]) * (i - lo);
}

const minutes = (ms: number) => Math.round(ms / 60_000);
const countBy = <K>(items: K[]) => {
  const map = new Map<K, number>();
  for (const k of items) map.set(k, (map.get(k) ?? 0) + 1);
  return map;
};
const ranked = (map: Map<string, number>, limit?: number) =>
  [...map].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, limit);

export const DURATION_BINS = [
  { label: 'Under 30 min', maxMin: 30 },
  { label: '30-60 min', maxMin: 60 },
  { label: '1-2 h', maxMin: 120 },
  { label: '2-4 h', maxMin: 240 },
  { label: '4 h or more', maxMin: Infinity },
];

/** Everything the Statistics page shows, for incidents dispatched in [start, end). */
export function computeStatistics(incidents: StatIncident[], opts: { from: string; to: string; alarmLevels: string[]; now?: Date }) {
  const { start, end } = manilaRange(opts.from, opts.to);
  const now = opts.now ?? new Date();
  const closed = incidents.filter((i) => i.status === 'CLOSED' && i.closedAt);
  const durationMin = (i: StatIncident) => minutes(i.closedAt!.getTime() - i.createdAt.getTime());
  const cityName = (i: StatIncident) => i.city?.name ?? 'Unknown';
  const isMutualAid = (i: StatIncident, u: StatUnit) => u.station.cityId !== null && i.cityId !== null && u.station.cityId !== i.cityId;
  const allUnits = incidents.flatMap((i) => i.units.map((u) => ({ incident: i, unit: u })));

  // Trend: a continuous axis of days, or of weeks (Mondays) past 90 days, so empty periods show as zero.
  const days = Math.round((Date.parse(`${opts.to}T00:00:00Z`) - Date.parse(`${opts.from}T00:00:00Z`)) / DAY_MS) + 1;
  const weekly = days > 90;
  const bucketOf = (date: string) => (weekly ? weekStart(date) : date);
  const trendCounts = countBy(incidents.map((i) => bucketOf(manilaDate(i.createdAt))));
  const trend: { bucket: string; count: number }[] = [];
  for (let d = bucketOf(opts.from); d <= opts.to; d = addDays(d, weekly ? 7 : 1)) trend.push({ bucket: d, count: trendCounts.get(d) ?? 0 });

  // Highest alarm reached, every level up to the highest present (zeros included, in settings order).
  const maxAlarm = incidents.reduce((m, i) => Math.max(m, i.alarmIndex), -1);
  const alarmCounts = countBy(incidents.map((i) => i.alarmIndex));
  const byAlarm = opts.alarmLevels.slice(0, maxAlarm + 1).map((level, index) => ({ level, index, count: alarmCounts.get(index) ?? 0 }));

  const districtCounts = new Map<string, { code: number; name: string; alias: string | null; count: number }>();
  for (const i of incidents) {
    if (!i.city) continue;
    const d = i.city.district;
    const entry = districtCounts.get(d.name) ?? { ...d, count: 0 };
    entry.count++;
    districtCounts.set(d.name, entry);
  }

  // Durations of closed incidents.
  const histogram = DURATION_BINS.map((b) => ({ label: b.label, count: 0 }));
  for (const i of closed) histogram[DURATION_BINS.findIndex((b) => durationMin(i) < b.maxMin)].count++;
  const durationsByCity = new Map<string, number[]>();
  for (const i of closed) durationsByCity.set(cityName(i), [...(durationsByCity.get(cityName(i)) ?? []), durationMin(i)]);

  // Time from dispatch to the first truck of each later alarm level.
  const toAlarm = opts.alarmLevels.slice(1).flatMap((level, k) => {
    const waits = incidents.flatMap((i) => {
      const first = i.units.filter((u) => u.alarmLevel === level).map((u) => u.dispatchedAt.getTime());
      return first.length ? [minutes(Math.min(...first) - i.createdAt.getTime())] : [];
    });
    return waits.length ? [{ level, index: k + 1, minutes: percentile(waits, 0.5)!, count: waits.length }] : [];
  });

  // Workload: dispatches and responding hours inside the range.
  const stations = new Map<number, { name: string; city: string; count: number }>();
  const trucks = new Map<number, { callSign: string; station: string; count: number; hours: number }>();
  for (const { unit: u } of allUnits) {
    const s = stations.get(u.station.id) ?? { name: u.station.name, city: u.station.city?.name ?? '', count: 0 };
    s.count++;
    stations.set(u.station.id, s);
    const t = trucks.get(u.truck.id) ?? { callSign: u.truck.callSign, station: u.station.name, count: 0, hours: 0 };
    t.count++;
    const busy = Math.min((u.releasedAt ?? now).getTime(), end.getTime()) - Math.max(u.dispatchedAt.getTime(), start.getTime());
    t.hours += Math.max(0, busy) / 3_600_000;
    trucks.set(u.truck.id, t);
  }
  const mutual = new Map<string, { name: string; sent: number; received: number }>();
  const aid = (name: string) => mutual.get(name) ?? mutual.set(name, { name, sent: 0, received: 0 }).get(name)!;
  for (const { incident: i, unit: u } of allUnits) {
    if (!isMutualAid(i, u)) continue;
    aid(u.station.city?.name ?? 'Unknown').sent++;
    aid(cityName(i)).received++;
  }

  // When and where.
  const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const i of incidents) {
    const { weekday, hour } = manilaWeekdayHour(i.createdAt);
    grid[weekday][hour]++;
  }
  const barangays = countBy(incidents.filter((i) => i.barangay).map((i) => `${i.barangay!.name}, ${cityName(i)}`));

  const durations = closed.map(durationMin);
  return {
    range: { from: opts.from, to: opts.to, bucket: weekly ? 'week' : 'day' },
    summary: {
      incidents: incidents.length,
      open: incidents.filter((i) => i.status === 'OPEN').length,
      closed: closed.length,
      medianDurationMin: percentile(durations, 0.5),
      p90DurationMin: percentile(durations, 0.9),
      unitsSent: allUnits.length,
      mutualAidUnits: allUnits.filter(({ incident, unit }) => isMutualAid(incident, unit)).length,
    },
    trend,
    byCity: ranked(countBy(incidents.map(cityName))),
    byDistrict: [...districtCounts.values()].sort((a, b) => a.code - b.code),
    byAlarm,
    duration: {
      histogram,
      byCity: [...durationsByCity]
        .map(([name, list]) => ({ name, minutes: percentile(list, 0.5)!, count: list.length }))
        .sort((a, b) => b.minutes - a.minutes),
      toAlarm,
    },
    workload: {
      stations: [...stations.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 10),
      trucks: [...trucks.values()]
        .map((t) => ({ ...t, hours: Math.round(t.hours * 10) / 10 }))
        .sort((a, b) => b.count - a.count || b.hours - a.hours)
        .slice(0, 10),
      mutualAid: [...mutual.values()].sort((a, b) => b.sent + b.received - (a.sent + a.received)),
    },
    when: { grid, barangays: ranked(barangays, 10) },
    points: incidents.slice(0, MAX_POINTS).map((i) => [i.lat, i.lng] as [number, number]),
    pointsTruncated: incidents.length > MAX_POINTS,
  };
}

/** One spreadsheet cell: quoted, and leading = + - @ (formula triggers in Excel/Sheets) neutralised with a quote. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** "2026-11-08 07:30" in Manila time. */
export const manilaDateTime = (d: Date | null) => (d ? new Date(d.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ') : '');
