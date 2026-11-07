# Stations and trucks API

Controller `StationsController` (`backend/src/stations/stations.controller.ts`), service `StationsService` (`stations.service.ts`), DTOs in `stations.dto.ts`.

Write routes need the `editStations` ability (SUPER_ADMIN, OPERATIONS) **and** `editCity` on the station's city (Operations whose `areaCityIds` contain it, or Super Admin). Record-check failures → 403.

**Station object** (`STATION_INCLUDE`): all `Station` columns plus

```json
{ "district": { "id", "code", "name", "color" },
  "city": { "id", "name" } | null,
  "trucks": [Truck…] }        // active trucks only, ordered by id
```

**Truck object:** all `Truck` columns (`id, stationId, callSign, plateNumber, type, waterCapacityLiters, ownership, status, isActive, createdAt, updatedAt`).

## GET /api/stations
- **Access:** `operate` (everyone signed in).
- **Query:** `districtId?` int, `cityId?` int.
- **200:** active stations ordered by `districtId`, `name`. No pagination.

## POST /api/stations
- **Body:** `name` (1–150), `lat`, `lng`, `cityId` (int, required), `address?` (≤250), `contactNumber?` (≤50). `districtId` is **not** accepted; it is taken from the city.
- **201:** Station.
- **Errors:** 400 validation / `Unknown city`; 403.
- **Audit:** `CREATE Station`.

## PATCH /api/stations/:id
- **Body (optional):** `name`, `lat`, `lng`, `cityId`, `address`, `contactNumber`, `isActive`.
- Requires `editCity` on the current city, and on the new city when `cityId` changes (district follows the city).
- `isActive: false` deactivates the station (soft delete; it disappears from lists and running cards).
- **200:** Station. **Errors:** 400, 403, 404 `Station not found` (also for inactive stations).
- **Audit:** `DEACTIVATE` or `UPDATE`, `changes` = body.

## POST /api/stations/:id/trucks
- **Body:** `callSign` (1–80), `type` (`ENGINE`, `TANKER`, `AERIAL_LADDER` or `OTHER`; `AMBULANCE` and `RESCUE` are rejected with 400: they are not fire trucks), `ownership` (`TruckOwnership`), `plateNumber?` (≤20), `waterCapacityLiters?` (int ≥ 0).
- **201:** Truck (status `AVAILABLE`). **Errors:** 400, 403, 404.
- **Audit:** `CREATE Truck`.

## PATCH /api/trucks/:id
- **Body (optional):** `callSign`, `plateNumber`, `type` (same four values), `waterCapacityLiters`, `ownership`, `status` (`TruckStatus`).
- Any status may be set by hand, including `RESPONDING` (see [gaps](../security/gaps.md)).
- **200:** Truck. **Errors:** 400, 403, 404 `Truck not found` (also for retired trucks).
- **Audit:** `STATUS` when the body has only `status`, else `UPDATE`.

## DELETE /api/trucks/:id
- **204.** Soft delete (`isActive = false`); history keeps the truck. A truck currently `RESPONDING` can be retired; the incident's close step still updates it by id (**Needs Verification** of intended behavior).
- **Audit:** `DELETE Truck`.
