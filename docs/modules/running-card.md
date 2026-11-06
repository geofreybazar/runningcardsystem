# Module: running-card

`backend/src/running-card/` · API: [running-card](../api/running-card.md) · Process: [building the card](../architecture/business-processes.md#1-building-the-running-card)

- `running-card.logic.ts` (pure): `haversineKm(a, b)`, `buildRunningCard(origin, stations, rules)`. Tested in `running-card.logic.spec.ts`.
- `RunningCardService.generate(origin, { excludeStationIds })`: loads settings and active stations with ≥ 1 available truck, then builds the card. Exported for `IncidentsModule`.
- `RunningCardController`: `GET /running-card` returns `{ city: CityDirectory.cityAt(), alarms }`.
