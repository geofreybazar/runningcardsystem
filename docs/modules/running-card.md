# Module: running-card

`backend/src/running-card/` · API: [running-card](../api/running-card.md) · Process: [building the card](../architecture/business-processes.md#1-building-the-running-card)

- `running-card.logic.ts` (pure): `haversineKm(a, b)`, `withinStraightLine(origin, stations, maxKm)` (pre-filter), `nearestFirst(stations, maxKm)`, `buildRunningCard(stationsWithDistance, rules)`. Tested in `running-card.logic.spec.ts`.
- `RunningCardService.generate(origin, { excludeStationIds })`: loads settings and active stations with ≥ 1 available truck, keeps those within `maxDistanceKm` in a straight line, gets their road distances from [routing](routing.md), then builds the card. `nearestWithType()` does the same for special units. Exported for `IncidentsModule`.
- `RunningCardController`: `GET /running-card` returns `{ city: CityDirectory.cityAt(), alarms }`.
