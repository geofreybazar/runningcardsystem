# Testing

## Backend unit tests (`npm test`)

Vitest (`backend/vitest.config.ts`, globals on, `**/*.spec.ts`).

| Spec | Covers |
|---|---|
| `src/running-card/running-card.logic.spec.ts` | ordering, grouping per alarm, max distance, haversine |
| `src/geo/city-locator.spec.ts` | ray casting; known places in Manila, Quezon City, Caloocan, Makati, Pasig; outside NCR; every seeded station lands in a city of its own district |
| `src/auth/area.spec.ts` | `areaCityIds` and `dispatchCityId` for each office type |

Run one file: `npx vitest run src/geo/city-locator.spec.ts`.

## Backend end-to-end tests (`npm run test:e2e`)

Vitest with `vitest.config.e2e.ts`: `**/*.e2e-spec.ts`, `globalSetup: test/global-setup.ts`, `fileParallelism: false` (one shared database), 20 s test / 60 s hook timeouts. Requests use supertest against the full Nest app built by `test/helpers.ts` (`createApp()` applies `configureApp()` like `main.ts`).

**Database handling:** `global-setup.ts` refuses to run unless the `TEST_DATABASE_URL` database name ends with `_test`, then drops and recreates the `public` schema, runs `prisma migrate deploy` and `prisma db seed`. `helpers.ts` points `DATABASE_URL` at the test database and raises `LOGIN_RATE_LIMIT` to 1000.

| Spec | Covers |
|---|---|
| `test/auth.e2e-spec.ts` | uniform login error; temporary-password lock; refresh rotation and reuse detection; logout; role/office validation; Admin cannot manage Super Admin; disable/remove effects; self-protection |
| `test/stations.e2e-spec.ts` | listing filters; district vs city Operations scope; radio cannot edit; Super Admin edits anywhere |
| `test/running-card.e2e-spec.ts` | ordering/grouping; skipping stations without available trucks; `city` in response; bad coordinates; barangay pin rules; settings changes apply to the card |
| `test/incidents.e2e-spec.ts` | who may dispatch where (city, FD1, FD2, regional, Operations, Admin, Super Admin, outside NCR); lifecycle (picks, next alarm, raise, close, out-of-service kept); busy-station rule; area visibility |

**Helpers** (`test/helpers.ts`): `superAdminAuth(app)` (works whichever spec ran first), `makeUser(app, admin, accountNumber, role, office?)` (creates and signs in, changing the temporary password), `cityId(app, auth, name)`, `refreshCookie(res)`.

**Writing specs:** files run in any order on one database. Use unique account numbers (each spec has its own prefix/range), look up ids by name (`cityId`), and never assume a fresh seed beyond the reference data.

## Frontend tests (`npm test`)

`node --test` runs the `*.test.js` files next to the helpers in `src/utils/` and `src/service/` (`parseCoordinates`, permissions, alarm, stats, audit, validation, SSE parsing). There are no component or browser tests in the repository.

## Not covered

- No CI configuration exists in the repository.
- No automated UI tests. Screenshots taken during development used an ad-hoc Playwright script that is not committed.
- Docker images and `docker-compose.yml` are not exercised by any test (**Needs Verification**).

## Clock steps (WSL 2)

The WSL 2 clock can step back and forth by several seconds (seen: −5.8 s every ~30 s). Anything comparing wall-clock times can then flake. The app is hardened against this: access tokens get a 30 s clock tolerance, and notification "seen" marks use ids, not times. If time-based flakes appear, check the clock by sampling `date +%s.%N` against `/proc/uptime`. To stop the drift itself, run `sudo hwclock -s` or `wsl --update`.

## Browser e2e (Playwright)

`cd frontend && npm run test:e2e` clicks through the real UI in headless Chromium (`frontend/e2e/*.spec.js`, config `frontend/playwright.config.js`). Playwright starts two servers of its own and stops them afterwards:

- **API on port 3100:** `backend/test/browser-server.ts` (`npm run e2e:browser-server`) **wipes, migrates and seeds the `TEST_DATABASE_URL` database** (same guard as the API e2e: the name must end in `_test`), builds into `backend/dist-e2e/`, and starts the app. A running `start:dev` (port 3000, `dist/`, dev database) is not touched.
- **Web on port 5180:** Vite with `API_URL=http://localhost:3100`.

Specs (one worker, the database is shared): sign-in with the forced first password change and sign-out; running card → dispatch → incident → close; adding a Regional Operations user and finding it with the Users filters; a special deployment (create, add a truck, set its post, "Deployed" on Stations, end, delete).

Locations are entered as typed coordinates (no Google call), so the specs run without a Maps key. Map rendering and Google search are not covered. Don't run it at the same time as `npm run test:e2e` in the backend: both use the `_test` database. CI runs it as the `browser` job and uploads the Playwright report when it fails. First time locally: `npx playwright install chromium`.

