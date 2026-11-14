# Module: incidents

`backend/src/incidents/` · API: [incidents](../api/incidents.md) · Processes: [dispatch, raise, close](../architecture/business-processes.md#3-dispatch-create-incident)

- Imports `RunningCardModule`.
- `IncidentsController`: class `@Can('operate')`; create / next-alarm / raise / special-units / close also `@Can('dispatch')`.
- `IncidentsService`:
  - `visibleTo(user)`: area filter for list and detail.
  - `list`, `get` (adds `alarmLevel`, `nextAlarmLevel`).
  - `create`: `cityAt` → `dispatchIn` → card → transaction.
  - `nextAlarm(id)`: next card, skipping outside-city stations already on the incident; own-city stations may send another truck.
  - `raise`: `dispatchIn` → conditional `alarmIndex` bump → claim.
  - `close`: `dispatchIn` → release trucks and units.
  - Private `dispatch()`: claims one truck per station with a conditional update.
- DTOs: `CreateIncidentDto`, `RaiseAlarmDto`, `IncidentQuery`, type `TruckPicks`.
- Depends on: `PrismaService`, `RunningCardService`, `CityDirectory`, `AuthorizationService`. Does **not** use `AuditService`.
- Note: the comment above `list()` ("Operations see incidents their district responded to…") is out of date; the code applies `visibleTo()`.
