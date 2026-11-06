# Module: stations

`backend/src/stations/` · API: [stations](../api/stations.md)

- `StationsController`: `GET /stations` (`operate`); writes need `editStations`.
- `StationsService`: `list(districtId?, cityId?)`, `create`, `update`, `addTruck`, `updateTruck`, `removeTruck`.
  - Every write calls `authz.authorize(AccessPolicy, 'editCity', user, cityId)` on the station's city (and the new city on a move).
  - `districtId` is always derived from the city via `CityDirectory`.
  - Deactivation/retirement is soft (`isActive = false`); all writes are audited.
- DTOs (`stations.dto.ts`): `StationQuery`, `CreateStationDto` (requires `cityId`), `UpdateStationDto`, `CreateTruckDto`, `UpdateTruckDto`.
- Depends on: `PrismaService`, `AuditService`, `AuthorizationService`, `CityDirectory`.
