/**
 * Trucks per type, available of total, grouped by district or city, plus the sum of the groups.
 * `types` is the column order (TRUCK_TYPES keys); passed in so this file imports nothing (node:test runs it as is).
 */
export function resourceCounts(stations, groupBy, types) {
  const empty = () => ({ byType: Object.fromEntries(types.map((t) => [t, { available: 0, total: 0, statuses: {} }])), total: { available: 0, total: 0 } });
  const add = (bucket, truck) => {
    const cell = bucket.byType[truck.type];
    if (!cell) return; // a type not shown as a column
    cell.total += 1;
    cell.statuses[truck.status] = (cell.statuses[truck.status] ?? 0) + 1;
    bucket.total.total += 1;
    if (truck.status === "AVAILABLE") {
      cell.available += 1;
      bucket.total.available += 1;
    }
  };

  const groups = new Map();
  const sum = empty();
  for (const s of stations) {
    const [key, label, color] =
      groupBy === "district" ? [`d${s.district.id}`, s.district.name, s.district.color] : [`c${s.city?.id ?? "none"}`, s.city?.name ?? "No city set", null];
    if (!groups.has(key)) groups.set(key, { key, label, color, district: groupBy === "district" ? s.district : null, order: groupBy === "district" ? s.district.code : 0, ...empty() });
    const row = groups.get(key);
    for (const t of s.trucks) {
      add(row, t);
      add(sum, t);
    }
  }
  const rows = [...groups.values()].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  return { rows, sum };
}
