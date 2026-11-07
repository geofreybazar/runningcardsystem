export const NOTIFICATION_TITLES = { DISPATCHED: "Dispatched", ALARM_RAISED: "Alarm raised", INCIDENT_CLOSED: "Incident closed" };

/**
 * "Our trucks: E-12 (Station 3, Caloocan), …", or null when none moved. The server already limits units to the
 * account's area (Regional: all), so these are always "ours".
 */
export const unitsLine = (n) =>
  n.units.length ? `Our trucks: ${n.units.map((u) => `${u.callSign} (${[u.station, u.city].filter(Boolean).join(", ")})`).join("; ")}` : null;
