# Business processes

## 1. Building the running card

Source: `backend/src/running-card/running-card.service.ts`, `running-card.logic.ts`.

1. Load `Settings` (row id 1): `stationsPerAlarm`, `maxDistanceKm`, `alarmLevels`.
2. Load stations where `isActive = true`, `id NOT IN excludeStationIds`, and at least one truck has `isActive = true AND status = 'AVAILABLE' AND type IN (MINI_PUMPER, ENGINE, TANKER)`. Each station includes only those trucks, ordered by `id`.
3. `withinStraightLine()` keeps stations within `maxDistanceKm` in a straight line (a road is never shorter, so no station within range by road is lost).
4. `RoadDistanceService` ([routing](../modules/routing.md)) gets each one's **road distance** (km) from the station to the fire from OSRM. If OSRM is unavailable, the haversine distance is used instead and the station is marked `byRoad: false`.
5. `buildRunningCard()` drops stations beyond `maxDistanceKm` by that distance, sorts ascending, and slices into groups of `stationsPerAlarm`, one group per alarm level, in order.
6. Alarm levels with no stations are dropped, so a card can have fewer levels than `alarmLevels`.

The card is computed on every request; nothing is cached. Distance is the driving route (car profile, no live traffic), not travel time.

## 2. Which city a point is in

Source: `backend/src/geo/city-locator.ts`, `city-directory.service.ts`.

```mermaid
flowchart TD
  P["point (lat, lng)"] --> B{inside a city's bbox?}
  B -->|yes| R{inside any barangay ring<br/>of that city?}
  R -->|yes| C[return city]
  R -->|no| B
  B -->|no more cities| N{"nearest ring segment<br/>within 1 km?"}
  N -->|yes| C2[return nearest city]
  N -->|no| X["null: outside NCR"]
```

Boundaries are barangay outer rings grouped per city, stored in `City.boundary` and loaded once per process by `CityDirectory`. Used by the running card response (`city`), incident creation, and the seed backfill.

## 3. Dispatch (create incident)

Source: `backend/src/incidents/incidents.service.ts` (`create`, `dispatch`).

```mermaid
sequenceDiagram
  autonumber
  participant RO as Radio Operator (UI)
  participant API as IncidentsService.create
  participant GEO as CityDirectory
  participant RC as RunningCardService
  participant DB as PostgreSQL
  RO->>API: POST /api/incidents {lat,lng,locationLabel,truckPicks?}
  API->>GEO: cityAt(lat,lng)
  GEO-->>API: city or null (400 if null)
  API->>API: authorize dispatchIn(user, city.id) (403 if not)
  API->>RC: generate(lat,lng)
  RC-->>API: card (400 if empty)
  API->>DB: BEGIN
  API->>DB: INSERT Incident (cityId, runningCard snapshot, createdById)
  loop each station in card[0]
    API->>DB: UPDATE Truck SET status=RESPONDING WHERE id=? AND status=AVAILABLE AND isActive
    alt count = 1
      API->>DB: INSERT IncidentUnit (alarmLevel = card[0].alarmLevel)
    else truck taken meanwhile
      API->>DB: try the station's next available truck
    end
  end
  API->>DB: COMMIT (rollback + 409 if no truck was claimed)
  API-->>RO: incident detail
```

Rules:
- **One truck per station.** The operator's pick (`truckPicks[stationId]`) is tried first, then the station's other available trucks in `id` order.
- **No double booking.** The conditional update means a truck already `RESPONDING` is never claimed again. A station with no free truck is not on the card at all, so the next nearest station takes its place (covered by `test/incidents.e2e-spec.ts`, "never sends a truck that is already on another incident").
- The full card at dispatch time is stored as JSON in `Incident.runningCard`.

## 4. Raise alarm

Source: `incidents.service.ts` (`nextAlarm`, `raise`).

1. Load the open incident (404 if missing, 400 if closed); authorize `dispatchIn(user, incident.cityId)`.
2. `nextAlarm()`: next level name = `alarmLevels[alarmIndex + 1]` (null → 400 "already at the highest alarm level"). Recompute the card from the incident location, excluding stations already on the incident by an alarm (units with `special = false`); the first group becomes the next alarm.
3. In a transaction: `UPDATE Incident SET alarmIndex = alarmIndex + 1 WHERE id AND status = OPEN AND alarmIndex = <value read in step 2>`. If 0 rows → 409 (someone else raised it). Then claim trucks as in dispatch (409 if none).

`GET /api/incidents/:id/next-alarm` returns the same preview without changing anything.

## 4a. Special units

Source: `incidents.service.ts` (`specialUnits`, `requestSpecialUnit`), `running-card.service.ts` (`nearestWithType`).

Ladders, rescue trucks, CSSR trucks and ambulances are never on the running card. The fire city's dispatcher picks a type on the incident page, gets the nearest stations with one available, and sends one. It is claimed like any dispatch (conditional update to `RESPONDING`, 409 if taken) and recorded as a unit with `special = true` under the current alarm level, without raising the alarm. Close releases it with the other units.

## 5. Close incident

Source: `incidents.service.ts` (`close`).

One transaction:
1. Trucks of unreleased units with `status = RESPONDING` → `AVAILABLE`. Trucks Operations set to `OUT_OF_SERVICE` meanwhile keep that status.
2. All units with `releasedAt = null` get `releasedAt = now()`.
3. Incident → `CLOSED`, `closedAt`, `closedById`.

Units are released only when the whole incident closes; there is no per-unit release endpoint.

## 5a. Notifying involved cities

Source: `notifications.service.ts` (`record`, `publish`), called from `create`, `raise` and `close`.

```mermaid
sequenceDiagram
  participant R as Manila radio operator
  participant I as IncidentsService
  participant N as NotificationsService
  participant DB as PostgreSQL
  participant C as Involved offices + Regional (browsers)
  R->>I: POST /incidents/:id/raise
  I->>DB: transaction: claim trucks, create units
  I->>N: record(tx, ALARM_RAISED, units of this step)
  N->>DB: one Notification, cityIds = involved cities
  I->>N: publish(ids) after commit
  N-->>C: SSE event: notification (each office sees only its own trucks)
```

- **Involved cities** at each step: the fire's city, the city of every station with a unit on the incident (earlier alarms included), and the city of every station on the incident's running card snapshot (all alarm levels, saved at dispatch).
- **Types:** `DISPATCHED` (incident created, 1st Alarm), `ALARM_RAISED`, `INCIDENT_CLOSED` (lists released trucks).
- **Recipients:** every account of an involved city's office and of its district office (FD1/FD5 district offices are their single city), and every Regional account. Each office's copy lists only its own area's trucks; Regional sees all. A city that is only on the card gets the notification with no trucks.
- Involved offices can open the incident: `visibleTo()` includes incidents with a notification naming a city in their area.
- Rows are written inside the incident transaction, so a failed dispatch leaves no notification; live delivery happens after commit.
- No acknowledgement in this phase: "unread" is per account (`User.notificationsSeenId`, by notification id). Acknowledgement, reminders and SMS/email are planned for a future phase.
- The UI: bell with unread badge in the top bar, a short red toast with a beep when the account's trucks are sent, a count of open incidents on the sidebar's Incidents item, and the **Notifications** page (open incidents involving us + the feed).
- Every open page reacts to the live event: the incident page reloads (so a raise by Manila shows up at once in Caloocan), and the incidents list reloads. While an incident is on screen its notifications are marked read (`POST /notifications/seen { incidentId }`) and no toast is shown.
- The incident page shows a **time log** (dispatch, each alarm raised, close, with time and who) built from the step notifications.

## 6. Account lifecycle

Source: `backend/src/users/users.service.ts`, `auth/auth.service.ts`.

```mermaid
stateDiagram-v2
  [*] --> TempPassword: Admin creates (random 12-char password, mustChangePassword = true)
  TempPassword --> Active: user changes password (other sessions revoked)
  Active --> TempPassword: Admin resets password (all sessions revoked)
  Active --> Disabled: Admin sets isActive = false (all sessions revoked)
  Disabled --> Active: Admin sets isActive = true
  Active --> Removed: Admin deletes (soft: deletedAt, account number renamed, sessions revoked)
  Disabled --> Removed
  Removed --> [*]
```

While `mustChangePassword` is true, `AccessPolicy.before()` denies every `@Can(...)` route; only `@Can.Anyone()` routes (`/auth/me`, `/auth/change-password`) and public routes work.

## 7. Barangay pin

Source: `backend/src/districts/districts.controller.ts`, `frontend/src/components/features/runningCard/locationSearch/LocationSearch.jsx`.

1. The user picks District → City → Barangay in the UI.
2. If the barangay has `lat/lng`, the UI uses it.
3. Otherwise the UI geocodes `"<barangay>, <city>, Metro Manila, Philippines"` with Google and sends `PUT /api/barangays/:id/location`. When the stored pin is null, any signed-in user may set it, and this is **not** audit-logged.
4. Overwriting an existing pin requires `editCity` on the barangay's city and is audit-logged with old and new values.
