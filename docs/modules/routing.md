# Module: routing

`backend/src/routing/` · Used by: [running-card](running-card.md) · Process: [building the card](../architecture/business-processes.md#1-building-the-running-card) · Deploy: [OSRM road graph](../development/deployment.md#osrm-road-graph-deployosrm)

Road distances for the running card, from a self-hosted [OSRM](https://project-osrm.org) router on OpenStreetMap roads (the `osrm` compose service). No outside service and no per-request cost.

- `RoadDistanceService.fromStations(fire, stations)` → `{ distance, byRoad }[]`, one per station, in order.
  - One OSRM **table** request: the stations are the sources and the fire is the only destination, so one-way streets count in the direction a truck drives. Metres → km.
  - **Fallback, never an error:** without `OSRM_URL`, on an HTTP/OSRM error, or after a 2 s timeout, every station gets its haversine distance and `byRoad: false`. A station OSRM can't route (`null` in the table) gets its own haversine distance. One warning is logged per outage, and one info line when OSRM answers again.
  - Tested with a mocked `fetch` in `road-distance.service.spec.ts`.
- `RoutingModule` builds the service from `process.env.OSRM_URL` (compose sets `http://osrm:5000`; unset in dev, unit/e2e tests and CI, so they use the fallback).
- The road graph covers NCR plus a margin (bbox lng 120.85–121.25, lat 14.25–14.85). A station or fire outside it routes poorly or not at all, and falls back per station.
- Car profile: no fire-truck restrictions (height/weight) and no live traffic. `shortcut: car profile, upgrade to a custom truck profile if narrow-street routes prove wrong in practice`.
- `shortcut: no cache, one table request for the in-range stations takes a few ms on the same host; add a short per-origin cache if it shows in latency`.
