# Security gaps and risks

Findings from reading the code. Severity is a judgment for this application (an internal dispatch tool). Items marked **Needs Verification** depend on runtime or deployment behavior that could not be confirmed from source.

| # | Severity | Finding | Where | Suggested direction |
|---|---|---|---|---|
| 1 | Resolved | **Login rate limit per real client.** `TRUST_PROXY` makes Express read the client IP from `X-Forwarded-For` behind nginx (`docker-compose.yml` sets `1`). | `app.setup.ts` | — |
| 2 | Resolved | **Global rate limit.** `ThrottlerGuard` is an `APP_GUARD`: `GLOBAL_RATE_LIMIT` (600/min per client IP) on every route, `LOGIN_RATE_LIMIT` on login. | `app.module.ts` | — |
| 3 | Resolved | **Swagger UI off in production.** Mounted only when `SWAGGER=true`, or `SWAGGER` unset and `NODE_ENV` ≠ `production`. | `main.ts` | — |
| 4 | Resolved | **Next-alarm preview is city-scoped** with `dispatchIn(incident.cityId)`. | `incidents.service.ts` (`previewNextAlarm`) | — |
| 5 | Medium | **First barangay pin is open to every signed-in user** (including view-only accounts) (it is now audit-logged as `SET_PIN`). A wrong first pin affects later lookups until Operations corrects it. | `districts.controller.ts` | Log first pins; optionally restrict to dispatchers/Operations. |
| 6 | Resolved | **Incident actions are audited** (`DISPATCH`, `RAISE_ALARM`, `CLOSE` with trucks), as are sign-ins (with IP and failure reason), sign-outs, token reuse and own password changes. Entries are written in the same transaction as the change. | `incidents.service.ts`, `auth.service.ts`, `auth-audit.listener.ts` | — |
| 7 | Low | **Truck status can be set to `RESPONDING` by hand**, bypassing incident tracking (no unit is created). | `stations.dto.ts` (`UpdateTruckDto.status`) | Allow only `AVAILABLE`/`OUT_OF_SERVICE` manually. |
| 8 | Resolved | **`truckPicks` contents validated.** The Zod schema requires a map of integer truck ids (`incidents.dto.ts`). | `incidents.dto.ts` | — |
| 9 | Resolved | **`take` on `GET /incidents` now requires ≥ 1** (Zod schema); still capped at 500 in the service. | `incidents.dto.ts` | — |
| 10 | Low | **No security headers** (no Helmet), no CSP. CSRF relies on the refresh cookie being `SameSite=Strict` and path-scoped, plus bearer tokens for every other route. | `app.setup.ts` | Add Helmet / CSP at the API or nginx. |
| 11 | Low | **Refresh tokens are never purged**, so the tables grow over time. Noted as a shortcut in code. | `prisma-refresh-token.store.ts` | Scheduled cleanup of rows past `familyExpiresAt`. |
| 12 | Low | **`RefreshToken.userId` has no foreign key**, so orphan rows are possible (users are never hard-deleted, so the practical impact is low). | `schema.prisma` | Acceptable, or add a relation. |
| 13 | Info | **Pre-1.0 auth libraries** (`@nestjs/authentication 0.1.x`, `@nestjs/authorization 0.1.x`). APIs may change. | `package.json` | Pin versions; re-test on upgrade. |
| 14 | Info | **Cookie `Secure` can be disabled** with `COOKIE_SECURE=false` (intended for HTTP-only LANs). With it disabled, the refresh token travels in clear text on HTTP. | `auth.controller.ts` | Serve over HTTPS. |
| 15 | Low | **Password policy is length-only** (≥ 8). Account lockout: resolved by a 5-minute pause after 5 wrong passwords per account (`login-attempts.ts`). | `auth.dto.ts` | Consider complexity rules. |
| 16a | Resolved | **Backend container starts.** The runtime image now has the seed's sources and dev dependencies; verified with `docker compose up` (see [deployment](../development/deployment.md#backend-image-backenddockerfile)). | `backend/Dockerfile` | — |
| 16 | Info | **Backend image installs dev dependencies** (`npm ci --include=dev`, ≈ 1.4 GB) because the seed run on every start needs `tsx` and `barangay`. Larger attack surface in production. | `backend/Dockerfile` | Separate seed image or step. |
| 17 | Info | **Google Maps key is public by design** (browser key, embedded at build time). It must be restricted by HTTP referrer and API in Google Cloud. A previous key value exists in git history (an old commented line in `index.html`, since removed). | `frontend/Dockerfile`, git history | Restrict or rotate the key. |
| 19 | Very low | **"Mark incident seen" accepts incidents outside the caller's area.** `POST /notifications/seen { incidentId }` only changes the caller's own unread state, but 204 vs 404 confirms that an incident id exists. | `notifications.service.ts` (`markSeen`) | Apply the incidents `visibleTo()` filter. |
| 18 | Info | **Station list has no pagination**; all stations and trucks are returned to every signed-in user. Acceptable at the current size (~156). | `stations.service.ts` | Add pagination if the data grows. |

## Sensitive data exposure review

- `passwordHash` is never selected in API responses (`AUTH_USER_SELECT`, `PUBLIC_FIELDS`).
- Temporary passwords are returned once in the create/reset response, by design.
- Audit `changes` hold request bodies for users/stations/trucks/settings; no password fields are included.
- Error responses use Nest defaults; stack traces are not returned by Nest's default filter (**Needs Verification** for unhandled Prisma errors in production mode).
- `.env` files are gitignored; `.env.example` files contain only placeholders.
