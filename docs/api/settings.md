# Settings API

Controller `SettingsController` (`backend/src/settings/settings.controller.ts`); no service.

## GET /api/settings
- **Access:** `operate`.
- **200:** `{ "id": 1, "stationsPerAlarm": 4, "maxDistanceKm": 100, "alarmLevels": ["1st Alarm", …] }`
- **500** if the row does not exist (`findUniqueOrThrow`); the seed creates it.

## PUT /api/settings
- **Access:** `manageSettings` (SUPER_ADMIN).
- **Body (all required):**
  | Field | Rules |
  |---|---|
  | `stationsPerAlarm` | int 1–20 |
  | `maxDistanceKm` | number 1–200 |
  | `alarmLevels` | string[] with 1–30 items, each 1–40 chars; trimmed; must be unique |
- **Rule:** if any OPEN incident has `alarmIndex ≥ alarmLevels.length` → 400 `An open incident is at an alarm level you are removing. Close it first.`
- **200:** saved settings. **Audit:** `UPDATE Settings` with `{ before, after }`.
- Renaming a level does not rename `IncidentUnit.alarmLevel` on existing units; incident `alarmLevel` fields are recomputed from the new list by position.
