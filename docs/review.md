# Documentation review

Results of checking the documentation against the code (commit `49aaa8a`).

## Inconsistencies between code and existing text

| # | Where | What it says | What the code does |
|---|---|---|---|
| 1 | `backend/src/incidents/incidents.service.ts`, comment above `list()` | "Operations see incidents their district responded to; everyone else sees all." | `list()` applies `visibleTo(user)`: area-based for every office; only Regional/Admin/Super Admin see all. |
| 2 | `backend/src/districts/districts.controller.ts`, comment above `setLocation()` | "correcting an existing pin is an Operations job for that district" | Overwrite requires `editCity` on the barangay's **city** (city-level Operations offices are covered). |
| 3 | `backend/AGENTS.md` | Describes NestJS Observe telemetry ("This app's production telemetry … goes to NestJS Observe") | `@nestjs/observe` is not installed and `ObserveModule` is not registered. The file is the Nest 12 scaffold template. |
| 4 | `backend/package.json` script `deploy: nest deploy` | — | Scaffold script; no deployment target is configured. **Needs Verification** of what it would do. |
| 5 | Root `README.md` (before this review) | Docker section implied a working `docker compose up` | The backend runtime image likely cannot run the seed (see [deployment](development/deployment.md#backend-image-backenddockerfile)). |
| 6 | `backend/prisma/schema.prisma` comment on `Barangay.lat` | "correctable by Operations" | Correct, but "first pin by any signed-in user" is not mentioned. |

Items 1, 2, 3 and 6 are comments and documentation, so they were not changed: this review was told not to modify application source. They are listed here to be fixed later.

## Assumptions and items needing verification

| Item | Why it can't be verified from source |
|---|---|
| Docker images and compose stack work end to end | Never built or run here; one probable defect found (backend seed imports `src/`). |
| Login rate limit behind nginx keys on the real client IP | Depends on Express `trust proxy` (not set) and the throttler's default tracker. |
| `/api/docs` is reachable without authentication | `SwaggerModule.setup` registers an Express route; whether Nest guards apply was not tested. |
| JWT signing algorithm | Not set explicitly; library default. |
| Refresh tokens stored as hashes | Stated by the library's documentation; storage is internal to `TokenService`. |
| Exact 401/403 response bodies | Produced by `@nestjs/authentication` / `@nestjs/authorization`. |
| Barangay names match official PSGC spellings | Data comes from the `barangay` npm package. |
| City boundary accuracy at borders | Simplified outlines plus a 1 km nearest-city fallback. |
| Behavior when a truck on an open incident is retired (`DELETE /trucks/:id`) | Allowed by code; the intended business rule is unknown. |
| Production error responses never include stack traces | Nest default filter behavior; not tested with Prisma errors. |

## Missing documentation / not covered by the code base

- No CI pipeline, so there are no documented CI checks.
- No API versioning.
- No OpenAPI schemas (Swagger has routes only).
- No backup/restore or data-retention procedure for incidents and the audit log.
- No monitoring or logging strategy beyond Nest's default logger.
- No user-facing manual for radio operators or Operations staff.

## Verification performed

- Every route in `docs/api/` was matched to the `@Get/@Post/@Patch/@Put/@Delete` decorators in `backend/src/**/*.controller.ts` (29 routes; a script compared the two lists).
- Models, fields, enums, unique constraints, indexes and foreign-key delete rules were matched to `schema.prisma` and both `migration.sql` files.
- File paths referenced in these documents were checked to exist (see the link check in the final review).
- Mermaid diagrams use only relations, routes and modules present in the code.
