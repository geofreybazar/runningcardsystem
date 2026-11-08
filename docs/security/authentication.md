# Authentication

Implemented with `@nestjs/authentication` `^0.1.5` (a pre-1.0, first-party NestJS package), configured in `backend/src/app.module.ts` and `backend/src/auth/`.

## Configuration

| Setting | Value | Source |
|---|---|---|
| Access token | JWT signed with `JWT_SECRET`, issuer `bfp-ncr-rcs`, audience `rcs-web`, TTL **15 min** | `app.module.ts` |
| Signing algorithm | library default (**Needs Verification**; `alg` not set explicitly) | |
| Refresh token | opaque, TTL **7 d**, family absolute TTL **30 d**, rotated on every use | `app.module.ts` |
| Refresh store | `PrismaRefreshTokenStore` (`RefreshToken`, `RevokedRefreshFamily` tables) | `auth/prisma-refresh-token.store.ts` |
| Credential provider | `JwtAuth extends JwtBearerProvider` (realm `rcs`) | `auth/jwt-auth.provider.ts` |
| Global guard | registered by `AuthenticationModule`; every route needs a valid token unless `@Public()` | library |

The library stores only hashes of refresh tokens, per its documentation (**Needs Verification**: the store receives `RefreshTokenRecord` objects; whether `id` is derived from the secret is internal to the library).

## Flows

```mermaid
sequenceDiagram
  autonumber
  participant UI as SPA
  participant A as AuthController
  participant S as AuthService
  participant T as TokenService (library)
  participant DB as PostgreSQL
  UI->>A: POST /api/auth/login {accountNumber,password}
  A->>S: login()
  S->>DB: find user (deletedAt null)
  S->>S: PasswordHasher.verify (dummy hash if no user)
  S->>T: issue(userId)
  T->>DB: save RefreshToken
  A-->>UI: {accessToken, expiresIn, user} + Set-Cookie rcs_rt (httpOnly, Strict, path /api/auth)
  Note over UI: access token kept in memory only
  UI->>A: API calls with Bearer token …
  UI->>A: POST /api/auth/refresh (cookie)
  A->>S: refresh(token)
  S->>T: refresh(): mark used (conditional), issue successor
  alt token already used
    T->>DB: revoke whole family
    A-->>UI: 401 + clear cookie
  else ok
    S->>DB: UserLoader.load(sub) (401 if disabled)
    A-->>UI: new access token + rotated cookie
  end
```

- **Every request reloads the user.** `JwtAuth.validate({ sub })` calls `UserLoader.load()`, which returns null for inactive or soft-deleted users (→ 401). Disabling, removing or changing an office takes effect on the next request even with an unexpired access token.
- **Reuse detection.** `markRefreshTokenUsed` is a conditional `updateMany(where usedAt = null)`, so only one concurrent refresh wins. Presenting a spent token revokes the family (library behavior; covered by `test/auth.e2e-spec.ts`).
- **Logout** revokes the cookie's family and clears the cookie.
- **Revoke all** (`TokenService.revokeAll`) runs on password change, password reset, disable and removal.

## Cookie

`AuthController.respond()` sets `rcs_rt` with `httpOnly: true`, `sameSite: 'strict'`, `path: '/api/auth'`, `maxAge` 7 days, and `secure` = `COOKIE_SECURE === 'true'` when `COOKIE_SECURE` is set, otherwise `NODE_ENV === 'production'`. The refresh token is never in a response body.

## Passwords

| Aspect | Implementation |
|---|---|
| Hashing | `PasswordHasher` from `@nestjs/authentication` (scrypt, library defaults) |
| Rehash | on login when `needsRehash()` |
| Timing | `verify()` checks against a dummy hash when the user does not exist |
| Policy | new password 8–200 chars and different from the current one; no complexity rules |
| Temporary passwords | `randomBytes(9).toString('base64url')` (12 chars), returned once on create/reset; `mustChangePassword = true` |
| First Super Admin | from `SUPERADMIN_ACCOUNT_NUMBER` / `SUPERADMIN_PASSWORD` at seed time, must change on first sign-in |

## Forced password change

`AccessPolicy.before()` returns `false` when `user.mustChangePassword`, so every `@Can(AccessPolicy, …)` route returns 403 until the password is changed. `/auth/me` and `/auth/change-password` use `@Can.Anyone()` and stay reachable. The frontend shows only `ChangePasswordPage` in that state.

## Rate limiting

`ThrottlerGuard` is global (`app.module.ts`): every route allows `GLOBAL_RATE_LIMIT` (default 600) requests per client IP per 60 s, and `POST /api/auth/login` allows `LOGIN_RATE_LIMIT` (default 30; generous because stations have dynamic, often carrier-NAT shared IPs). The client IP is `req.ip`; behind nginx set `TRUST_PROXY` (e.g. `1`) so Express takes it from `X-Forwarded-For`, otherwise every client shares the proxy's IP. Leave it unset without a proxy, or clients could fake their IP. Tested in `test/rate-limit.e2e-spec.ts`.

**Clock tolerance:** `JwtAuth` verifies access tokens with `clockTolerance: '30s'`. With the library default of 0, a server clock that steps back (WSL/VM time corrections, NTP stepping) makes tokens issued just before the step look "issued in the future" and refuses them with 401. Found 2026-11-07 as intermittent e2e failures on WSL 2, whose clock stepped back 5.8 s every ~30 s. 30 s is negligible against the 15-minute token life.

**Per-account pause** (`LoginAttempts`, `auth/login-attempts.ts`): after 5 wrong passwords for the same account number within 15 minutes, from any IP, sign-in for that account answers 429 `Too many failed sign-ins for this account. Try again in N minutes.` for 5 minutes, without checking the password. A successful sign-in clears the count. The key is the typed account number (uppercased), existing or not, so a pause doesn't reveal which accounts exist. Signed-in sessions are unaffected (refresh doesn't go through sign-in). The pause is short on purpose: someone who knows an account number can pause it, but only briefly. In memory per process (`shortcut:`), like the notification stream.

## Frontend handling

`frontend/src/service/client.js` keeps the access token in a module variable, refreshes once on 401 (shared promise for concurrent calls), and restores the session on page load via `POST /api/auth/refresh`. See [frontend architecture](../architecture/frontend.md#api-client-behavior-srcapiclientjs).
