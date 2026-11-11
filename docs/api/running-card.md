# Running card API

Controller `RunningCardController` (`backend/src/running-card/running-card.controller.ts`), services `RunningCardService` + `CityDirectory`.

## GET /api/running-card
- **Access:** `viewRunningCard`: Radio Operators (any office, including view-only district/regional ones) and Super Admin. Admin and Operations get 403.
- **Query:** `lat` (latitude), `lng` (longitude), both required, converted to numbers.
- **200:**

```json
{
  "city": { "id": 7, "name": "Manila", "districtId": 1 } ,   // null when outside NCR
  "alarms": [
    {
      "alarmLevel": "1st Alarm",
      "stations": [
        {
          "id": 12, "name": "Sampaloc Fire Sub-Station", "lat": 14.6, "lng": 120.99,
          "contactNumber": null,
          "district": { "code": 1, "name": "Fire District 1", "color": "#fb923c" },
          "trucks": [{ "id": 30, "callSign": "…", "type": "ENGINE", "plateNumber": null, "waterCapacityLiters": null }],
          "distance": 0.01,
          "byRoad": true
        }
      ]
    }
  ]
}
```

- `distance` is road kilometers from the station to the fire ([routing](../modules/routing.md)). `byRoad: false` means road routing was unavailable and it is the straight-line distance; the web app marks it with ≈. The same fields appear on next-alarm previews, special-unit lists, and the `runningCard` saved on an incident (incidents saved before road distances have no `byRoad`). Only `AVAILABLE`, active Mini Pumpers, Engines and Tankers are listed (special units are requested per incident); stations without one are omitted. Empty alarm levels are dropped. See [business processes](../architecture/business-processes.md#1-building-the-running-card).
- **Errors:** 400 for missing or invalid coordinates. Coordinates outside NCR are valid: `city` is `null` and stations within `maxDistanceKm` are still listed.
