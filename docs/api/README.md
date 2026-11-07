# API conventions

REST/JSON API served by the NestJS backend: 33 routes in 9 controllers, plus the Swagger UI in development.

## Base URL and transport

- Every route is under the global prefix **`/api`** (`backend/src/app.setup.ts`).
- In development the frontend calls `/api/*` on its own origin and Vite proxies it. In Docker, nginx proxies `/api/` to the backend.
- CORS allows only `FRONTEND_ORIGIN`, with credentials.
- Swagger UI is mounted at **`/api/docs`** (`backend/src/main.ts`) only when `SWAGGER=true`, or when `SWAGGER` is unset and `NODE_ENV` is not `production`. It bypasses Nest guards, so it is off in production by default. No `@ApiProperty`/`@ApiTags` decorators or Swagger CLI plugin are used, so the generated document lists routes but **not** request/response schemas. This page set is the reference.

## Authentication

| Mechanism | Used for |
|---|---|
| `Authorization: Bearer <accessToken>` | every non-public route. Access tokens are JWTs that live 15 minutes |
| `rcs_rt` cookie (httpOnly, `SameSite=Strict`, path `/api/auth`, `Secure` in production) | refresh token, read only by `POST /api/auth/refresh` and `/logout` |

Details: [security/authentication](../security/authentication.md).

## Authorization notation used in these pages

| Notation | Meaning |
|---|---|
| Public | `@Public()`: no token needed |
| Any signed-in | `@Can.Anyone()`: any valid token, **including** accounts that must still change their password |
| `operate` | any signed-in account that does not have to change its password |
| `editStations`, `manageUsers`, `viewAuditLog`, `manageSettings`, `dispatch` | `AccessPolicy` abilities, listed in [authorization](../security/authorization.md) |
| record checks | additional `editCity` / `dispatchIn` / area filters applied in services |

## Validation

Global `StandardSchemaValidationPipe` (Nest 12):
- Bodies and queries are validated against Zod schemas passed as `@Body({ schema })` / `@Query({ schema })`. They are `z.strictObject`s, so unknown fields → 400; query numbers are coerced.
- Unknown properties cause **400** (`property X should not exist`).
- Query strings are converted with `@Type(() => Number)` where declared.
- Path ids use `ParseIntPipe` (integers) or `ParseUUIDPipe` (users, incidents); bad ids give **400**.

## Errors

There is no custom exception filter. Errors use Nest's default JSON shape:

```json
{ "statusCode": 400, "message": "Alarm level names must be unique", "error": "Bad Request" }
```

Validation errors return `message` as an array of strings.

| Status | Produced by |
|---|---|
| 400 | DTO validation, `ParseIntPipe`/`ParseUUIDPipe`, `BadRequestException` in services |
| 401 | Missing/invalid/expired access token (authentication guard, `WWW-Authenticate: Bearer realm="rcs"`); bad login; invalid, expired or reused refresh token |
| 403 | `@Can` ability denied; `authorize()` record check denied; `ForbiddenException` in services. The body does not name the ability |
| 404 | `NotFoundException` (record missing or soft-deleted) |
| 409 | `ConflictException` (account number already registered; trucks or incident changed during dispatch) |
| 429 | Login rate limit (`ThrottlerGuard`) |
| 500 | Unhandled errors (e.g. `findUniqueOrThrow` on a missing `Settings` row) |

Exact 401/403 bodies from `@nestjs/authentication` / `@nestjs/authorization` are **Needs Verification**: they come from the libraries, not from this code.

## Endpoint index

| Method | Path | Access | Doc |
|---|---|---|---|
| POST | `/api/auth/login` | Public (rate-limited) | [auth](auth.md) |
| POST | `/api/auth/refresh` | Public (cookie) | [auth](auth.md) |
| POST | `/api/auth/logout` | Public (cookie) | [auth](auth.md) |
| GET | `/api/auth/me` | Any signed-in | [auth](auth.md) |
| POST | `/api/auth/change-password` | Any signed-in | [auth](auth.md) |
| GET | `/api/users` | `manageUsers` | [users](users.md) |
| POST | `/api/users` | `manageUsers` + role check | [users](users.md) |
| PATCH | `/api/users/:id` | `manageUsers` + role check | [users](users.md) |
| POST | `/api/users/:id/reset-password` | `manageUsers` + role check | [users](users.md) |
| DELETE | `/api/users/:id` | `manageUsers` + role check | [users](users.md) |
| GET | `/api/districts` | `operate` | [districts](districts.md) |
| GET | `/api/cities/:id/barangays` | `operate` | [districts](districts.md) |
| PUT | `/api/barangays/:id/location` | `operate` (+ `editCity` to overwrite) | [districts](districts.md) |
| GET | `/api/stations` | `operate` | [stations](stations.md) |
| POST | `/api/stations` | `editStations` + `editCity` | [stations](stations.md) |
| PATCH | `/api/stations/:id` | `editStations` + `editCity` | [stations](stations.md) |
| POST | `/api/stations/:id/trucks` | `editStations` + `editCity` | [stations](stations.md) |
| PATCH | `/api/trucks/:id` | `editStations` + `editCity` | [stations](stations.md) |
| DELETE | `/api/trucks/:id` | `editStations` + `editCity` | [stations](stations.md) |
| GET | `/api/running-card` | `operate` | [running-card](running-card.md) |
| GET | `/api/incidents` | `operate` + area filter | [incidents](incidents.md) |
| GET | `/api/incidents/:id` | `operate` + area filter | [incidents](incidents.md) |
| POST | `/api/incidents` | `operate` + `dispatch` + `dispatchIn` | [incidents](incidents.md) |
| GET | `/api/incidents/:id/next-alarm` | `operate` + `dispatch` | [incidents](incidents.md) |
| POST | `/api/incidents/:id/raise` | `operate` + `dispatch` + `dispatchIn` | [incidents](incidents.md) |
| POST | `/api/incidents/:id/close` | `operate` + `dispatch` + `dispatchIn` | [incidents](incidents.md) |
| GET | `/api/settings` | `operate` | [settings](settings.md) |
| PUT | `/api/settings` | `manageSettings` | [settings](settings.md) |
| GET | `/api/audit-logs` | `viewAuditLog` | [audit](audit.md) |
| GET | `/api/docs` | Swagger UI (development only, see above) | — |
