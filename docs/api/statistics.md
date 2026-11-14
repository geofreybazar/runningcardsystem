# Statistics API

Controller `StatisticsController` (`backend/src/statistics/statistics.controller.ts`), service `StatisticsService`; aggregation in `statistics.logic.ts` (pure, unit-tested). Every route needs `operate`.

**Scope:** only fires inside the viewer's cities (`fireInArea()` in `statistics.service.ts`, from `areaCityIds`): a city office counts its city, a district office its cities, Regional accounts (incl. Admin and Super Admin) all of NCR. Unlike the Incidents page, a fire in another city is not counted even when the office's trucks responded to it, so mutual aid only shows trucks sent between cities of the same area. The district/city filters narrow that further; they never widen it. The page locks the district and city filters to the office's area.

**Times** are Manila time (UTC+8): date filters, daily/weekly buckets, the weekday x hour grid, and CSV timestamps.

## Query (both routes)

| Param | Meaning |
|---|---|
| `from`, `to` | Manila dates `YYYY-MM-DD`, inclusive. Default: the last 30 days. `from` ≤ `to`; at most 2 years apart (else 400). |
| `districtId`, `cityId` | optional; incidents whose fire is in that district / city |

## GET /api/statistics
- **200:**

```json
{
  "range": { "from": "2026-10-10", "to": "2026-11-08", "bucket": "day" },
  "summary": { "incidents": 12, "open": 0, "closed": 12, "medianDurationMin": 1, "p90DurationMin": 21, "unitsSent": 124, "mutualAidUnits": 79 },
  "trend": [{ "bucket": "2026-10-10", "count": 0 }],
  "byCity": [{ "name": "Manila", "count": 8 }],
  "byDistrict": [{ "code": 1, "name": "Fire District 1", "alias": "…", "count": 8 }],
  "byAlarm": [{ "level": "1st Alarm", "index": 0, "count": 1 }],
  "duration": {
    "histogram": [{ "label": "Under 30 min", "count": 11 }],
    "byCity": [{ "name": "Caloocan", "minutes": 22, "count": 3 }],
    "toAlarm": [{ "level": "2nd Alarm", "index": 1, "minutes": 0, "count": 7 }]
  },
  "workload": {
    "stations": [{ "name": "…", "city": "Caloocan", "count": 11 }],
    "trucks": [{ "callSign": "…", "station": "…", "count": 11, "hours": 3.2 }],
    "mutualAid": [{ "name": "Caloocan", "sent": 27, "received": 24 }]
  },
  "when": { "grid": [[0, 0, "… 24 hours"], "… 7 days, Monday first"], "barangays": [{ "name": "Catmon, Malabon", "count": 1 }] },
  "points": [[14.65, 120.98]],
  "pointsTruncated": false
}
```

- `trend` is continuous (empty days are 0); weekly buckets (Mondays) when the range is over 90 days.
- `byAlarm`: each incident counted once, at its highest alarm; every level up to the highest present.
- Durations use closed incidents (dispatch to close). `toAlarm`: median minutes from dispatch to the first truck of that level.
- Truck `hours`: time responding inside the range (open units count until now).
- Mutual aid: a unit whose station's city differs from the fire's city (`sent` by the station's city, `received` by the fire's city).
- `points` capped at 2,000 (`pointsTruncated`). shortcut: aggregation is in memory; move to SQL if volume grows.

## GET /api/statistics/incidents.csv
- **200:** `text/csv`, `Content-Disposition: attachment; filename="running-card-incidents_<from>_to_<to>.csv"`. UTF-8 with BOM (Excel), CRLF.
- Columns: Dispatched (Manila), Location, Barangay, City, District, Highest alarm, Status, Closed (Manila), Duration (min), Trucks sent, Mutual-aid trucks, Dispatched by.
- Every cell is quoted; cells starting with `=`, `+`, `-`, `@`, tab or CR get a leading `'` so spreadsheets don't run them as formulas.
