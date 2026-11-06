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

**Helpers** (`test/helpers.ts`): `superAdminAuth(app)` (works whichever spec ran first), `makeUser(app, admin, username, role, office?)` (creates and signs in, changing the temporary password), `cityId(app, auth, name)`, `refreshCookie(res)`.

**Writing specs:** files run in any order on one database. Use unique usernames, look up ids by name (`cityId`), and never assume a fresh seed beyond the reference data.

## Frontend tests (`npm test`)

`node --test` runs `src/variables/variables.test.js` (`parseCoordinates`). There are no component or browser tests in the repository.

## Not covered

- No CI configuration exists in the repository.
- No automated UI tests. Screenshots taken during development used an ad-hoc Playwright script that is not committed.
- Docker images and `docker-compose.yml` are not exercised by any test (**Needs Verification**).
