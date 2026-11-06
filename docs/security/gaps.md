# Security gaps and risks

Findings from reading the code. Severity is a judgment for this application (an internal dispatch tool). Items marked **Needs Verification** depend on runtime or deployment behavior that could not be confirmed from source.

| # | Severity | Finding | Where | Suggested direction |
|---|---|---|---|---|
| 1 | High (Docker deployments) | **Login rate limit keyed by proxy IP.** Express `trust proxy` is not enabled, so behind nginx every client may share the proxy's IP. Ten failed logins per minute from anyone could block all logins. **Needs Verification** in a deployed setup. | `app.setup.ts`, `auth.controller.ts` | Enable `trust proxy` for the known proxy, or key the limit by username + IP. |
| 2 | Medium | **No global rate limit.** `ThrottlerModule` (100/min) is registered but `ThrottlerGuard` is only on login; there is no `APP_GUARD`. | `app.module.ts` | Register `ThrottlerGuard` globally if intended. |
| 3 | Medium | **Swagger UI exposed.** `/api/docs` is mounted via `SwaggerModule.setup` and appears to bypass Nest guards (Express route). It reveals the route list. **Needs Verification.** | `main.ts` | Disable in production or protect it. |
| 4 | Medium | **Next-alarm preview not city-scoped.** `GET /incidents/:id/next-alarm` checks only the `dispatch` ability; any dispatcher can preview any open incident, including one outside their area. Raise/close are correctly checked. | `incidents.controller.ts`, `incidents.service.ts` (`nextAlarm`) | Apply `dispatchIn(incident.cityId)` or `visibleTo`. |
| 5 | Medium | **First barangay pin is open to every signed-in user** (including view-only accounts) and is not audit-logged. A wrong first pin affects later lookups until Operations corrects it. | `districts.controller.ts` | Log first pins; optionally restrict to dispatchers/Operations. |
| 6 | Medium | **Incident actions are not audited.** Dispatch, raise and close do not call `AuditService`; only `createdById`/`closedById` are stored, so who raised an alarm is not recorded. | `incidents.service.ts` | Log incident actions or store the actor per unit. |
| 7 | Low | **Truck status can be set to `RESPONDING` by hand**, bypassing incident tracking (no unit is created). | `stations.dto.ts` (`UpdateTruckDto.status`) | Allow only `AVAILABLE`/`OUT_OF_SERVICE` manually. |
| 8 | Low | **`truckPicks` contents not validated.** Only `@IsObject()` is checked. Values are used only when they match the station's own available trucks, so no cross-station effect was found. | `incidents.dto.ts`, `incidents.service.ts` (`dispatch`) | Validate the map's keys and values as integers. |
| 9 | Low | **`take` on `GET /incidents` has no minimum.** It is capped at 500, but zero or negative values are passed to Prisma. | `incidents.dto.ts` | Add `@Min(1)`. |
| 10 | Low | **No security headers** (no Helmet), no CSP. CSRF relies on the refresh cookie being `SameSite=Strict` and path-scoped, plus bearer tokens for every other route. | `app.setup.ts` | Add Helmet / CSP at the API or nginx. |
| 11 | Low | **Refresh tokens are never purged**, so the tables grow over time. Noted as a shortcut in code. | `prisma-refresh-token.store.ts` | Scheduled cleanup of rows past `familyExpiresAt`. |
| 12 | Low | **`RefreshToken.userId` has no foreign key**, so orphan rows are possible (users are never hard-deleted, so the practical impact is low). | `schema.prisma` | Acceptable, or add a relation. |
| 13 | Info | **Pre-1.0 auth libraries** (`@nestjs/authentication 0.1.x`, `@nestjs/authorization 0.1.x`). APIs may change. | `package.json` | Pin versions; re-test on upgrade. |
| 14 | Info | **Cookie `Secure` can be disabled** with `COOKIE_SECURE=false` (intended for HTTP-only LANs). With it disabled, the refresh token travels in clear text on HTTP. | `auth.controller.ts` | Serve over HTTPS. |
| 15 | Info | **Password policy is length-only** (≥ 8). No lockout beyond the IP rate limit. | `auth.dto.ts` | Consider complexity rules and per-account lockout. |
| 16a | High (availability) | **Backend container likely cannot start.** The runtime image lacks `src/`, which `prisma/seed.ts` imports, and the start command runs the seed before the API. See [deployment](../development/deployment.md#backend-image-backenddockerfile). | `backend/Dockerfile` | Copy the required sources into the runtime image or seed from the build stage. |
| 16 | Info | **Backend image installs dev dependencies** (`npm ci` without `--omit=dev`) because the seed needs `tsx` and `barangay`. Larger attack surface in production. | `backend/Dockerfile` | Separate seed image or step. |
| 17 | Info | **Google Maps key is public by design** (browser key, embedded at build time). It must be restricted by HTTP referrer and API in Google Cloud. A previous key value exists in git history (an old commented line in `index.html`, since removed). | `frontend/Dockerfile`, git history | Restrict or rotate the key. |
| 18 | Info | **Station list has no pagination**; all stations and trucks are returned to every signed-in user. Acceptable at the current size (~156). | `stations.service.ts` | Add pagination if the data grows. |

## Sensitive data exposure review

- `passwordHash` is never selected in API responses (`AUTH_USER_SELECT`, `PUBLIC_FIELDS`).
- Temporary passwords are returned once in the create/reset response, by design.
- Audit `changes` hold request bodies for users/stations/trucks/settings; no password fields are included.
- Error responses use Nest defaults; stack traces are not returned by Nest's default filter (**Needs Verification** for unhandled Prisma errors in production mode).
- `.env` files are gitignored; `.env.example` files contain only placeholders.
