/** Settings ↔ form values: alarm levels are edited as one per line. */
export const toForm = (s) => ({ ...s, alarmLevels: s.alarmLevels.join("\n") });
export const toBody = (f) => ({
  stationsPerAlarm: f.stationsPerAlarm === "" ? undefined : Number(f.stationsPerAlarm),
  maxDistanceKm: f.maxDistanceKm === "" ? undefined : Number(f.maxDistanceKm),
  alarmLevels: f.alarmLevels
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean),
});
