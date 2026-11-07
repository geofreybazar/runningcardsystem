/** "45 min", "1 h 20 min", "3 h"; "—" when there is no value. */
export function formatMinutes(min) {
  if (min == null) return "—";
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

/** Heat-grid step for a count: 0 = empty (neutral), 1..5 = the BFP-red ramp, by share of the largest count. */
export const heatStep = (value, max) => (value <= 0 || max <= 0 ? 0 : Math.max(1, Math.ceil((value / max) * 5)));

/** YYYY-MM-DD for a local date (the app is used in Manila, so local = Manila). */
export const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Date presets for the filter row: { from, to } as YYYY-MM-DD. */
export function presetRange(preset, today = new Date()) {
  const to = isoDate(today);
  if (preset === "year") return { from: `${today.getFullYear()}-01-01`, to };
  const days = { "7d": 7, "30d": 30, "90d": 90 }[preset];
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: isoDate(from), to };
}

/** Axis label for a trend bucket: "Nov 8" for days, "Week of Nov 3" for weeks. */
export function bucketLabel(bucket, kind) {
  const label = new Date(`${bucket}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" });
  return kind === "week" ? `Week of ${label}` : label;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
