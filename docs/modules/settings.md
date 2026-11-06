# Module: settings

`backend/src/settings/` · API: [settings](../api/settings.md)

- `SettingsController` only (no service): `GET /settings` (`operate`), `PUT /settings` (`manageSettings`).
- Rules in `update`: trimmed unique level names; cannot shrink below the highest `alarmIndex` of any open incident; audited with before/after.
- Consumers: `RunningCardService` (rules), `IncidentsService` (level names by index).
