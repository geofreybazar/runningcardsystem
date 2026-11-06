# Module: geo

`backend/src/geo/` (global module) · Process: [which city a point is in](../architecture/business-processes.md#2-which-city-a-point-is-in) · Data: [seed data](../database/data-and-seeding.md#seed-data-files-backendprismaseed-data)

- `city-locator.ts` (pure): `pointInRing()` (ray casting), `locateCity(shapes, lat, lng, toleranceKm = 1)`: inside test over bbox-filtered barangay rings, then nearest segment within the tolerance, else `null`. Tested in `city-locator.spec.ts`.
- `CityDirectory` (`city-directory.service.ts`): lazily loads all `City` rows (with `boundary`) once per process.
  - `all()`, `get(id)`, `ofDistrict(districtId)`
  - `cityAt(lat, lng)` → `{ id, name, districtId } | null`
- Used by: `UserLoader`, `UsersService`, `StationsService`, `RunningCardController`, `IncidentsService`; the seed uses `locateCity` directly.
- Limitation: the cache is never invalidated; restart after re-seeding boundaries.
