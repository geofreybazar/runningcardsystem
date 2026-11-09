# Data, migrations and seeding

## Migrations

| Migration | Changes |
|---|---|
| `20261106152339_init` | All enums except `OfficeLevel`; all tables; indexes and foreign keys listed in [schema](schema.md). |
| `20261106163316_offices` | Enum `OfficeLevel`; `City.boundary`; `Incident.cityId` + index + FK; `User.officeLevel` (default `REGIONAL`) and `User.cityId` + FK. **Data step:** `UPDATE "User" SET "officeLevel" = 'DISTRICT' WHERE role = 'OPERATIONS' AND "districtId" IS NOT NULL`. |

Commands (run in `backend/`): `npx prisma migrate dev --name <name>` for development, `npx prisma migrate deploy` in production/Docker. With Prisma 7, `migrate dev` does not regenerate the client: run `npx prisma generate` after schema changes. The datasource URL is configured in `backend/prisma.config.ts` (`DATABASE_URL`), not in `schema.prisma`.

## Seed (`backend/prisma/seed.ts`)

Run with `npx prisma db seed` (configured as `tsx prisma/seed.ts` in `prisma.config.ts`). It is designed to be re-runnable: it only adds what is missing, with these exceptions noted.

| Step | Behavior | Re-run |
|---|---|---|
| Fire districts | Upsert 5 districts by `code`, with name, alias (FD1 "Manila Fire District", FD2 "CAMANAVA", FD5 "Quezon City Fire District") and color | no change to existing rows (`update: {}`) |
| Cities | Upsert 17 cities by `name` under their district; **always overwrites `City.boundary`** from `seed-data/ncr-city-boundaries.json` | boundary refreshed every run |
| Barangays | `createMany(skipDuplicates)` from the `barangay` npm package (dev dependency), names as spelled by the package | adds only missing ones |
| Stations | Created from `seed-data/stations.json` **only if the Station table is empty** and `SEED_STATIONS` isn't `false`; one placeholder `ENGINE` truck each when `SEED_PLACEHOLDER_TRUCKS=true` | skipped when stations exist |
| Station city backfill | Every station with `cityId = null` gets the city from `locateCity()` and that city's `districtId`; stations outside every boundary are printed as a warning | only fills nulls |
| Incident city backfill | Every incident with `cityId = null` gets its city if located | only fills nulls |
| Settings | Upsert row id 1 with 10 alarm levels | no change to an existing row |
| Super Admin | Creates account number `SUPERADMIN_ACCOUNT_NUMBER` (uppercased, name "Super Admin", no rank) with `SUPERADMIN_PASSWORD` (hashed), `role = SUPER_ADMIN`, `mustChangePassword = true`, if both variables are set and the account number does not exist | skipped when it exists |

Seeded alarm levels, in order: 1st Alarm, 2nd Alarm, 3rd Alarm, 4th Alarm, 5th Alarm, Task Force Alpha, Task Force Bravo, Task Force Charlie, Task Force Delta, General Alarm.

District → city mapping seeded:

| Code | Cities |
|---|---|
| 1 | Manila |
| 2 | Caloocan, Malabon, Navotas, Valenzuela |
| 3 | Pasay, Makati, Las Piñas, Parañaque, Muntinlupa |
| 4 | Marikina, Pasig, Pateros, Taguig, Mandaluyong, San Juan |
| 5 | Quezon City |

## Seed data files (`backend/prisma/seed-data/`)

| File | Contents | Origin |
|---|---|---|
| `stations.json` | 156 stations: `name`, `lat`, `lng`, `districtCode` | Exported from the original hardcoded frontend list. One correction was made: "TS Cruz Fire Substation" changed from FD4 to FD3, because its coordinates fall in Las Piñas. |
| `ncr-city-boundaries.json` | `{ source, cities: [{ psgc, name, bbox, rings }] }` with barangay outer rings per city, coordinates rounded to 6 decimals (~280 KB) | Built from `faeldon/philippines-json-maps` (MIT), `latest/geojson/municities/medres/bgysubmuns-municity-*.json`. Inner rings (holes) are dropped. |

Validation: `backend/src/geo/city-locator.spec.ts` checks that every seeded station lands in a city of its own district, and spot-checks known places.

## Data quality notes

- **Barangay names** come from the `barangay` npm package and may differ from official PSGC spellings. **Needs Verification** against PSGC.
- **Boundary accuracy.** The medium-resolution outlines are simplified. Points within slivers or gaps fall back to the nearest city within 1 km; accuracy along city borders is approximate.
- **`Station.cityId` and `Incident.cityId` are nullable in the database** even though the application treats them as required.
- **No bundled stations** (`SEED_STATIONS=false`): for a fresh production start where offices add their own stations and trucks. The seed runs on every container start, so without it an emptied Station table is refilled.
- **Placeholder trucks** (`SEED_PLACEHOLDER_TRUCKS=true`) are for demos and tests. With `false`, no station appears on any running card until Operations adds trucks.

## Test database

`backend/test/global-setup.ts` runs before e2e tests. It refuses to run unless the database name in `TEST_DATABASE_URL` ends with `_test`, then executes `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`, `prisma migrate deploy` and `prisma db seed` (super admin `superadmin` / a fixed test password, placeholder trucks on). See [testing](../development/testing.md).
