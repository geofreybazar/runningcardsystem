# Incidents API

Create, raise and close also create a [notification](notifications.md) for every involved city (fire, trucks sent, running card), their districts and the Regional office, (in the same transaction) and push them live after commit. Unit `station` objects include `cityId`.

Controller `IncidentsController` (`backend/src/incidents/incidents.controller.ts`), class-level `@Can(AccessPolicy, 'operate')`; the four dispatch routes also carry `@Can(AccessPolicy, 'dispatch')` (Super Admin, or a Radio Operator with a dispatch city). Service `IncidentsService` (`incidents.service.ts`). DTOs in `incidents.dto.ts`.

**Area filter** (`visibleTo`): accounts with `areaCityIds = null` (Regional office, Admin, Super Admin) see every incident. Others see incidents whose `cityId` is in their area, **or** where any unit's station is in their area, **or** that sent them a notification (e.g. a station of theirs is on the running card).

**Incident detail object** (`DETAIL_INCLUDE` + computed fields):

```json
{
  "id": "uuid", "lat": 14.6, "lng": 120.99, "locationLabel": "…", "barangayId": null, "cityId": 7,
  "status": "OPEN", "alarmIndex": 0, "runningCard": [/* card snapshot */], "notes": null,
  "createdById": "uuid", "closedById": null, "createdAt": "…", "closedAt": null,
  "city": { "id": 7, "name": "Manila" },
  "barangay": { "name": "…", "city": { "name": "…" } } | null,
  "createdBy": { "accountNumber": "…", "rank": "…", "firstName": "…", "middleName": "…", "lastName": "…" },
  "closedBy": { /* same */ } | null,
  "units": [{
    "id": 1, "incidentId": "uuid", "stationId": 12, "truckId": 30, "alarmLevel": "1st Alarm",
    "dispatchedAt": "…", "releasedAt": null,
    "station": { "id", "name", "districtId", "district": { "code", "name", "color" } },
    "truck": { "id", "callSign", "type", "plateNumber", "status" }
  }],
  "alarmLevel": "1st Alarm",          // Settings.alarmLevels[alarmIndex]
  "nextAlarmLevel": "2nd Alarm"       // or null
}
```

## GET /api/incidents
- **Query:** `status?` (`OPEN`|`CLOSED`), `take?` int (service caps at 500, default 100; no lower bound).
- **200:** incidents in the caller's area, newest first, without `runningCard`, with `createdBy` (account number, rank, names), `city { name }`, `_count { units }`, and computed `alarmLevel`.

## GET /api/incidents/:id
- **200:** detail object, including `timeline`: one entry per step `{ type: DISPATCHED | ALARM_RAISED | INCIDENT_CLOSED, alarmLevel, at, by: person | null, trucks }` (from the step's notification; incidents older than notifications fall back to the units, with `by` only for the dispatch and close). Unit stations include `city { name }`. **403** `This incident is outside your area` if it exists but is not visible; **404** if it does not exist.

## POST /api/incidents (dispatch)
- **Body:** `lat`, `lng`, `locationLabel` (1–250), `barangayId?` int, `notes?` (≤2000), `truckPicks?` object `{ "<stationId>": truckId }` (validated only as an object).
- **Flow:** locate the city (400 `This location is outside Metro Manila`) → `dispatchIn` (403) → build the card (400 `No station with an available truck is within range`) → transaction: insert the incident, claim one truck per 1st-alarm station (409 if none could be claimed).
- **201:** detail object.

## GET /api/incidents/:id/next-alarm
- **200:** `{ "alarmLevel": string, "fromAlarmIndex": number, "stations": [card stations] }`, or `null` at the highest level.
- **Errors:** 404, 400 `This incident is closed`.
- `dispatchIn(incident.cityId)`: only the fire city's dispatchers (and Super Admin) may preview it; others get 403.

## POST /api/incidents/:id/raise
- **Body:** `{ "truckPicks"?: object }`.
- **Flow:** open-incident check → `dispatchIn(incident.cityId)` → next alarm (400 at the highest level; 409 no stations) → transaction: conditional `alarmIndex` increment (409 if changed meanwhile) → claim trucks (409 if none).
- **200:** detail object.

## POST /api/incidents/:id/close
- **Flow:** open-incident check (404/400) → `dispatchIn(incident.cityId)` → transaction: `RESPONDING` trucks of unreleased units → `AVAILABLE`; units `releasedAt = now`; incident `CLOSED`, `closedAt`, `closedById`.
- **200:** detail object.

Incident actions are **not** written to the audit log.
