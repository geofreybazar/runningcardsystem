# Districts, cities and barangays API

Controller `DistrictsController` (`backend/src/districts/districts.controller.ts`), class-level `@Can(AccessPolicy, 'operate')`. No service: the controller uses `PrismaService`, `AuthorizationService` and `AuditService` directly.

## GET /api/districts
- **200:** districts ordered by `code`, each with its cities ordered by name:

```json
[{ "id": 1, "code": 1, "name": "Fire District 1", "alias": "Manila Fire District", "color": "#fb923c",
   "cities": [{ "id": 7, "name": "Manila" }] }]
```

## GET /api/cities/:id/barangays
- `:id` integer city id (no 404 for an unknown city; returns `[]`).
- **200:** `[{ "id", "name", "lat": number|null, "lng": number|null }]` ordered by `id` (seed order).

## PUT /api/barangays/:id/location
- **Body:** `{ "lat": latitude, "lng": longitude }` (`IsLatitude`/`IsLongitude`).
- **Rules:**
  - Barangay has no pin yet: any `operate` user may set it. Not audited.
  - Barangay already has a pin: requires `editCity` on the barangay's city (Operations covering that city, or Super Admin). Audited as `UPDATE Barangay` with `{ from, to }`.
- **200:** `{ "id", "name", "lat", "lng" }`.
- **Errors:** 400 validation; 403 overwrite not allowed; 404 `Barangay not found`.
