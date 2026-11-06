# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BFP-NCR Running Card System: finds the fire stations that respond to a location in Metro Manila, grouped into alarm levels, and tracks dispatch. Two apps: `frontend/` (React 19 + Vite + Tailwind v4 + shadcn/ui, Google Maps via `@vis.gl/react-google-maps`) and `backend/` (NestJS 12 + Prisma 7 + PostgreSQL). README.md has setup and the role/domain rules.

## Commands

Backend (`cd backend`):
- `npm run start:dev`, `npm run build`, `npm run lint` (oxlint)
- `npm test` — Vitest unit tests (`src/**/*.spec.ts`). Single file: `npx vitest run src/running-card/running-card.logic.spec.ts`
- `npm run test:e2e` — supertest against a real DB. `test/global-setup.ts` **drops and reseeds** the database in `TEST_DATABASE_URL` (refuses unless the name ends in `_test`; the user approved this). Single file: `npx vitest run --config vitest.config.e2e.ts test/incidents.e2e-spec.ts`. Spec files share one DB and run in any order: use `superAdminAuth()` / `makeUser()` from `test/helpers.ts` with unique usernames, never assume a fresh seed.
- `npx prisma migrate dev --name <x>` after editing `prisma/schema.prisma`; `npx prisma generate` regenerates the client into `src/generated/prisma` (gitignored). `npx prisma db seed` is idempotent. Prisma blocks `migrate reset` when run by an AI agent; ask the user before resetting anything.

Frontend (`cd frontend`): `npm run dev` (proxies `/api` to `API_URL`, default `localhost:3000`), `npm run build`, `npm run lint`, `npm test` (`node --test`, only pure helpers).

Local dev DBs on this machine: `runningcard_dev` / `runningcard_test` over the Postgres unix socket (see `backend/.env`). Docker isn't available in this WSL; `docker-compose.yml` is untested here.

## Backend architecture

- ESM-only Nest 12: relative imports end in `.js`, tests use Vitest (`vi.fn()`). `backend/AGENTS.md` lists Nest 12's first-party packages; check it before adding a library.
- **Auth** (`src/auth`): `@nestjs/authentication` issues 15-min access tokens + rotating refresh tokens. `PrismaRefreshTokenStore` implements its `RefreshTokenStore` (reuse of a spent token revokes the whole family). The refresh token only travels in the `rcs_rt` httpOnly cookie on path `/api/auth`; the body carries the access token. `JwtAuth.validate` reloads the user every request, so disabling a user or changing a role takes effect immediately.
- **Authorization**: `@nestjs/authorization` guard is deny-by-default; every route needs `@Can(AccessPolicy, '<ability>')`, `@Can.Anyone()`, or `@Public()`. `AccessPolicy.before()` blocks users with `mustChangePassword` from everything except `@Can.Anyone()` routes. Record-level rules live in services: `authz.authorize(AccessPolicy, 'editDistrict', user, districtId)` for Operations' own-district limit, `canManageRole` in `users.service.ts` for which accounts an Admin may manage. Policy ability params must be typed `AuthUser | null`.
- **Running card** (`src/running-card`): `running-card.logic.ts` is the pure rule (haversine, sort, group by `Settings.stationsPerAlarm` / `alarmLevels`, cut at `maxDistanceKm`). `RunningCardService.generate()` feeds it only active stations with ≥1 AVAILABLE truck. Incidents reuse it with `excludeStationIds` for "raise alarm".
- **Incidents** (`src/incidents`): dispatch claims trucks with conditional `updateMany(status: AVAILABLE → RESPONDING)` inside a transaction (one truck per station); raise is guarded by matching `alarmIndex`. `Incident.alarmIndex` is a position in `Settings.alarmLevels`, which is why settings can't shrink below an open incident's level.
- `AuditService.log()` records user/station/truck/barangay/settings changes.
- `main.ts` imports `dotenv/config` first because some decorators read env at import time (`LOGIN_RATE_LIMIT`). `app.setup.ts` holds the pipeline shared with e2e tests (global prefix `api`, cookie parser, ValidationPipe whitelist).

## Data model notes

- District → City → Barangay. FD1 (Manila) and FD5 (Quezon City) each have exactly one City row; the UI skips the city step for single-city districts. Barangays are seeded from the `barangay` npm package (seed-only dev dependency); `lat/lng` fill in on first geocode.
- Stations use `lat`/`lng` (the old frontend used `long`). `prisma/seed-data/stations.json` is the original hardcoded list.
- Removing users, stations and trucks is soft (`deletedAt` / `isActive`) so incident history keeps them.

## Frontend architecture

- `App.jsx`: `AuthProvider` → Google `APIProvider` → routes. `Layout.jsx` `NAV` lists each page with the roles that see it; routes are generated from it (the backend enforces the real rules).
- `api/client.js`: access token in memory only; on 401 it calls `/auth/refresh` once (concurrent callers share one request, since a refresh token works once) and retries. `AuthContext` restores the session on load from the refresh cookie.
- Running card page (`components/Home.jsx`): `LocationSearch` (Places API (New) suggestions, typed coordinates via `parseCoordinates`, District/City/Barangay pickers) → `location` → `GET /running-card` → `Card.jsx`; per-station truck picks are sent with Dispatch. Incident pages reuse `Card` for the next-alarm preview.
- Google key (`VITE_GOOGLE_API`) needs Maps JavaScript, Places API (New), Geocoding. The legacy `places.Autocomplete` widget is not available to this key.
- UI is shadcn/ui (JSX, `components.json`, Radix + lucide icons). `src/components/ui/` is generated by `npx shadcn@latest add <name>`: don't hand-edit it, and it is excluded from ESLint. The generated components need React 19 (refs as props). Imports use the `@/` alias (`vite.config.js` + `jsconfig.json`).
- App-level building blocks: `Page` (title/actions frame), `Field` (label + control), `SimpleSelect` (shadcn Select over `{value,label}` options, keeps number values), `ConfirmDialog`, `TruckStatusBadge`. Toasts via `sonner` for action results; inline `Alert` for form errors.
- Theme tokens live in `src/index.css`: neutral base, `--primary` = BFP red, `--gold` accent (active nav edge, brand mark). Use the tokens (`bg-primary`, `text-muted-foreground`, `bg-gold`), not raw colors. District colors come from the database.
- Layout is a collapsible shadcn `Sidebar` (sheet on mobile). Pages switch tables to cards below `md`.
- Shared enum labels in `src/labels.js`.
