/** "Nov 8, 2026, 3:24 PM" in the viewer's locale. */
export const formatDateTime = (d) => new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

/** "03:24 PM": time of day only. */
export const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** "Today", "Yesterday", or "Mon, Nov 9, 2026": a heading for a day's group of entries. */
export function formatDay(d) {
  const day = new Date(d);
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = (startOf(new Date()) - startOf(day)) / 86_400_000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return day.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/** Groups entries (newest first) by local day: [[dayLabel, entries], …]. */
export function groupByDay(entries, at = (e) => e.createdAt) {
  const groups = new Map();
  for (const e of entries) {
    const key = formatDay(at(e));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups.entries()];
}
