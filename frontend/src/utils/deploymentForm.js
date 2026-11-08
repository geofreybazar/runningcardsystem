/** A Date (or ISO string) as a `datetime-local` input value in the viewer's time zone: "2026-07-27T06:00". */
export function toLocalInput(d) {
  if (!d) return "";
  const date = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Form values for an existing deployment, or a blank one. */
export const deploymentToForm = (d) =>
  d
    ? {
        id: d.id,
        name: d.name,
        locationLabel: d.locationLabel,
        lat: d.lat,
        lng: d.lng,
        startsAt: toLocalInput(d.startsAt),
        endsAt: toLocalInput(d.endsAt),
        notes: d.notes ?? "",
      }
    : { name: "", locationLabel: "", lat: null, lng: null, startsAt: "", endsAt: "", notes: "" };

/** The request body; local input times become ISO instants, a blank end is "not planned". */
export const deploymentBody = (f) => ({
  name: f.name.trim(),
  locationLabel: f.locationLabel.trim(),
  lat: f.lat ?? undefined,
  lng: f.lng ?? undefined,
  startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : undefined,
  endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : null,
  notes: f.notes.trim() || null,
});
