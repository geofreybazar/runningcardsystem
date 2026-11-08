# Special deployments API

Controller `DeploymentsController` (`backend/src/deployments/deployments.controller.ts`), class-level `@Can(AccessPolicy, 'operate')`; every change also carries `@Can(AccessPolicy, 'manageDeployments')` (Super Admin, or Operations at the Regional office). Bodies are validated with the Zod schemas in `backend/src/shared/validation.ts` (`createDeploymentSchema`, `updateDeploymentSchema`, `assignTrucksSchema`). See the [module](../modules/deployments.md) for the rules.

| Method | Path | Ability | Body / query | Returns |
|---|---|---|---|---|
| GET | `/api/deployments` | operate | `?status=ACTIVE\|ENDED` | list, newest start first, with `createdBy` and `_count.units` (trucks still there) |
| GET | `/api/deployments/:id` | operate | | detail |
| POST | `/api/deployments` | manageDeployments | `{ name, locationLabel, lat, lng, startsAt, endsAt?, notes?, truckIds? }` | 201 detail |
| PATCH | `/api/deployments/:id` | manageDeployments | any of the create fields except `truckIds` | detail; 400 if ended |
| POST | `/api/deployments/:id/trucks` | manageDeployments | `{ truckIds: number[] }` (1–300) | detail; 409 if any truck isn't Available |
| PATCH | `/api/deployments/:id/trucks/:truckId/post` | manageDeployments | `{ postLabel, lat, lng }` | detail; where that truck stands (404 if it isn't on it) |
| POST | `/api/deployments/:id/trucks/:truckId/release` | manageDeployments | | detail; 404 if the truck isn't on it |
| POST | `/api/deployments/:id/end` | manageDeployments | | detail with `status: "ENDED"` |
| DELETE | `/api/deployments/:id` | manageDeployments | | 204; soft delete: trucks still there are released first (with a notification), then it is hidden (404 afterwards) |

`startsAt` / `endsAt` are ISO date-times; `endsAt` must not be before `startsAt` (400 "Ends before it starts").

**Detail object:**

```json
{
  "id": "uuid", "name": "SONA 2026", "locationLabel": "Batasang Pambansa", "lat": 14.69, "lng": 121.09,
  "startsAt": "…", "endsAt": null, "notes": null, "status": "ACTIVE",
  "createdBy": { "accountNumber", "rank", "firstName", "middleName", "lastName" }, "endedAt": null, "endedBy": null,
  "units": [{
    "id": 1, "truckId": 30, "stationId": 12, "assignedAt": "…", "releasedAt": null,
    "postLabel": "Quiapo Church", "postLat": 14.5986, "postLng": 120.9837,
    "station": { "id", "name", "city": { "id", "name" }, "district": { "code", "color" } },
    "truck": { "id", "callSign", "type", "plateNumber", "status" },
    "assignedBy": { /* person */ }, "releasedBy": null
  }]
}
```

Assigning and releasing create a [notification](notifications.md) with `deploymentId` (and `incidentId = null`, `alarmLevel = null`) for the cities of the trucks moved.
