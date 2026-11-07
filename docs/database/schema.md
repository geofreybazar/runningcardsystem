# Database schema

Source of truth: `backend/prisma/schema.prisma` and the migrations in `backend/prisma/migrations/` (`20261106152339_init`, `20261106163316_offices`, `20261107120000_user_rank_account_number`, `20261107140000_notifications`, `20261108090000_incident_views`, `20261108100000_single_city_district_offices`). PostgreSQL; Prisma 7 client generated to `backend/src/generated/prisma` (ESM).

14 models, 8 enums. See the [ER diagram](erd.md).

## Enums

| Enum | Values | Used by |
|---|---|---|
| `Role` | `SUPER_ADMIN`, `ADMIN`, `OPERATIONS`, `RADIO_OPERATOR` | `User.role` |
| `OfficeLevel` | `REGIONAL`, `DISTRICT`, `CITY` | `User.officeLevel` |
| `Rank` | `FO1`, `FO2`, `FO3`, `SFO1`, `SFO2`, `SFO3`, `SFO4`, `FINSP`, `FSINSP`, `FCINSP`, `FSUPT`, `FSSUPT`, `FCSUPT` (lowest → highest) | `User.rank` |
| `TruckType` | `ENGINE`, `TANKER`, `AERIAL_LADDER`, `RESCUE`, `AMBULANCE`, `OTHER` | `Truck.type` |
| `TruckOwnership` | `BFP`, `LGU`, `VOLUNTEER` | `Truck.ownership` |
| `TruckStatus` | `AVAILABLE`, `RESPONDING`, `OUT_OF_SERVICE` | `Truck.status` |
| `IncidentStatus` | `OPEN`, `CLOSED` | `Incident.status` |
| `NotificationType` | `DISPATCHED`, `ALARM_RAISED`, `INCIDENT_CLOSED` | `Notification.type` |

## Models

Types are Prisma types (`Int` → `integer`, `Float` → `double precision`, `DateTime` → `timestamp(3)`, `Json` → `jsonb`, `String[]` → `text[]`). "?" = nullable.

### FireDistrict
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `code` | Int | **unique**; 1–5 by seed |
| `name` | String | e.g. "Fire District 2" |
| `alias` | String? | e.g. "CAMANAVA" |
| `color` | String | hex color shown in the UI |

Relations: has many `City`, `Station`, `User`.

### City
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK |
| `name` | String | **unique** |
| `districtId` | Int | FK → `FireDistrict.id` (ON DELETE RESTRICT) |
| `boundary` | Json? | `{ bbox: [minLng,minLat,maxLng,maxLat], rings: [[lng,lat]…][] }`, written by the seed |

Relations: has many `Barangay`, `Station`, `User`, `Incident`.

### Barangay
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK |
| `name` | String | |
| `cityId` | Int | FK → `City.id` (RESTRICT) |
| `lat`, `lng` | Float? | set on first geocode; correctable |

Unique: `(cityId, name)`. Has many `Incident`.

### Station
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK |
| `name` | String | not unique |
| `lat`, `lng` | Float | |
| `districtId` | Int | FK → `FireDistrict.id` (RESTRICT); index `Station_districtId_idx` |
| `cityId` | Int? | FK → `City.id` (ON DELETE SET NULL). Nullable in the DB; the API always sets it and the seed backfills it |
| `address`, `contactNumber` | String? | |
| `isActive` | Boolean | default `true`; `false` = deactivated (soft delete) |
| `createdAt` / `updatedAt` | DateTime | default `now()` / `@updatedAt` |

Has many `Truck`, `IncidentUnit`. No index on `cityId`.

### Truck
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK |
| `stationId` | Int | FK → `Station.id` (RESTRICT); index |
| `callSign` | String | not unique |
| `plateNumber` | String? | |
| `type` | TruckType | default `ENGINE` |
| `waterCapacityLiters` | Int? | |
| `ownership` | TruckOwnership | default `BFP` |
| `status` | TruckStatus | default `AVAILABLE` |
| `isActive` | Boolean | default `true`; `false` = retired |
| `createdAt` / `updatedAt` | DateTime | |

Has many `IncidentUnit`.

### User
| Field | Type | Notes |
|---|---|---|
| `id` | String | PK, `uuid()` |
| `accountNumber` | String | **unique**. BFP personnel account number, stored uppercase; the sign-in name. Renamed from `username` |
| `rank` | Rank? | null only for Super Admin (and accounts migrated before ranks existed, until edited) |
| `firstName` | String | |
| `middleName` | String? | |
| `lastName` | String | |
| `passwordHash` | String | scrypt hash from `@nestjs/authentication` `PasswordHasher` |
| `role` | Role | |
| `officeLevel` | OfficeLevel | default `REGIONAL` |
| `districtId` | Int? | FK → `FireDistrict.id` (SET NULL). Set for DISTRICT and CITY offices |
| `cityId` | Int? | FK → `City.id` (SET NULL). Set for CITY offices |
| `isActive` | Boolean | default `true` |
| `mustChangePassword` | Boolean | default `true` |
| `deletedAt` | DateTime? | soft delete |
| `notificationsSeenAt` | DateTime? | notifications created after this are unread for this account |
| `createdAt` / `updatedAt` | DateTime | |

Relations: `incidentsCreated` / `incidentsClosed` (named relations `IncidentCreatedBy` / `IncidentClosedBy`), `auditLogs`.

Display name (frontend `displayName()` in `src/lib/person.js`): rank, first name, middle initial, last name, e.g. `SFO2 Juan D. Dela Cruz`.

Migration `20261107120000_user_rank_account_number` renamed `username` → `accountNumber` (uppercased), and split `fullName`: last word → `lastName`, the rest → `firstName` (a one-word name leaves `lastName` empty). Existing users get `rank = null`.

### RefreshToken
Store for `@nestjs/authentication` refresh-token rotation.

| Field | Type | Notes |
|---|---|---|
| `id` | String | PK (token id issued by the library) |
| `familyId` | String | index |
| `userId` | String | index. **Not a foreign key**: no relation to `User` is declared |
| `createdAt`, `expiresAt`, `familyExpiresAt` | DateTime | no defaults; set by the library |
| `usedAt` | DateTime? | set when the token is rotated |
| `claims` | Json? | |

### RevokedRefreshFamily
| Field | Type | Notes |
|---|---|---|
| `familyId` | String | PK |
| `familyExpiresAt` | DateTime | |

### Settings
Single row with `id = 1` (`@default(1)`).

| Field | Type | Default |
|---|---|---|
| `id` | Int | 1 |
| `stationsPerAlarm` | Int | 4 |
| `maxDistanceKm` | Float | 100 |
| `alarmLevels` | String[] | none (the seed writes 10 names) |

### Incident
| Field | Type | Notes |
|---|---|---|
| `id` | String | PK, uuid |
| `lat`, `lng` | Float | |
| `locationLabel` | String | |
| `barangayId` | Int? | FK → `Barangay.id` (SET NULL) |
| `cityId` | Int? | FK → `City.id` (SET NULL); index. Always set by the API; null only for incidents created before the offices migration that the seed could not locate |
| `status` | IncidentStatus | default `OPEN` |
| `alarmIndex` | Int | default 0; position in `Settings.alarmLevels` of the highest level dispatched |
| `runningCard` | Json | card snapshot at dispatch time |
| `notes` | String? | |
| `createdById` | String | FK → `User.id` (RESTRICT) |
| `closedById` | String? | FK → `User.id` (SET NULL) |
| `createdAt` | DateTime | default `now()` |
| `closedAt` | DateTime? | |

Index: `(status, createdAt)`, `(cityId)`. Has many `IncidentUnit`.

### IncidentUnit
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK |
| `incidentId` | String | FK → `Incident.id` (RESTRICT); index |
| `stationId` | Int | FK → `Station.id` (RESTRICT) |
| `truckId` | Int | FK → `Truck.id` (RESTRICT) |
| `alarmLevel` | String | level name at dispatch time (copied, not a reference) |
| `dispatchedAt` | DateTime | default `now()` |
| `releasedAt` | DateTime? | set when the incident closes |

### AuditLog
| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK |
| `userId` | String | FK → `User.id` (RESTRICT) |
| `action` | String | free text; values used in code: `CREATE`, `UPDATE`, `DELETE`, `DISABLE`, `RESET_PASSWORD`, `DEACTIVATE`, `STATUS` |
| `entity` | String | values used: `User`, `Station`, `Truck`, `Barangay`, `Settings` |
| `entityId` | String | id as text |
| `changes` | Json? | |
| `createdAt` | DateTime | default `now()` |

Indexes: `(entity, entityId)`, `(createdAt)`.


### Notification
One per incident step (dispatch, raise alarm, close). See [notifications API](../api/notifications.md).

| Field | Type | Notes |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `incidentId` | String | FK → `Incident.id` |
| `cityIds` | Int[] | involved cities: the fire's city, cities with a truck on the incident, cities with a station on its running card. GIN index |
| `type` | NotificationType | |
| `alarmLevel` | String | the level dispatched/raised to, or the incident's level at close |
| `units` | Json | trucks moved in this step: `[{ station, callSign, cityId, city }]`; may be empty |
| `actorId` | String | FK → `User.id` (relation `NotificationActor`): who dispatched/raised/closed |
| `createdAt` | DateTime | default `now()`, indexed |


### IncidentView
When an account last looked at an incident; its notifications up to `seenAt` count as read.

| Field | Type | Notes |
|---|---|---|
| `userId` | String | FK → `User.id`; PK part |
| `incidentId` | String | FK → `Incident.id`; PK part |
| `seenAt` | DateTime | |

## Unique constraints and indexes (from migrations)

| Name | Columns | Kind |
|---|---|---|
| `FireDistrict_code_key` | `FireDistrict(code)` | unique |
| `City_name_key` | `City(name)` | unique |
| `Barangay_cityId_name_key` | `Barangay(cityId, name)` | unique |
| `User_accountNumber_key` | `User(accountNumber)` | unique |
| `Station_districtId_idx` | `Station(districtId)` | index |
| `Truck_stationId_idx` | `Truck(stationId)` | index |
| `RefreshToken_userId_idx`, `RefreshToken_familyId_idx` | | index |
| `Incident_status_createdAt_idx` | `Incident(status, createdAt)` | index |
| `Incident_cityId_idx` | `Incident(cityId)` | index |
| `IncidentUnit_incidentId_idx` | `IncidentUnit(incidentId)` | index |
| `AuditLog_entity_entityId_idx`, `AuditLog_createdAt_idx` | | index |
| `Notification_cityIds_idx` | `Notification USING GIN (cityIds)` | index |
| `Notification_createdAt_idx` | `Notification(createdAt)` | index |

All foreign keys use `ON UPDATE CASCADE`. Delete behavior: required relations `RESTRICT`, optional relations `SET NULL`. No application code hard-deletes rows from these tables except `prisma migrate reset` / the e2e global setup on the test database.

## Business rules enforced in code (not in the database)

| Rule | Where |
|---|---|
| A station's `districtId` always equals its city's district | `StationsService.create/update`, seed backfill |
| A user's office fields match `OFFICE_LEVELS[role]` (REGIONAL: no district/city; DISTRICT: district; CITY: city + its district, never Manila or Quezon City) | `UsersService.office()` |
| One truck can be on at most one open incident | conditional update in `IncidentsService.dispatch()` |
| `Settings.alarmLevels` must have unique names and may not shrink below any open incident's `alarmIndex` | `SettingsController.update` |
| Removed users get `accountNumber` renamed to `<accountNumber>#deleted-<timestamp>` so the number can be reused | `UsersService.remove` |
| One notification per incident step, created in the same transaction | `NotificationsService.record` |
| Only `Settings` row id 1 is used | every `settings.findUniqueOrThrow({ where: { id: 1 } })` |
