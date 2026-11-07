# Auth API

Controller `AuthController` (`backend/src/auth/auth.controller.ts`), service `AuthService` (`auth.service.ts`). Zod schemas in `auth.dto.ts`.

`AuthUser` (returned as `user` below) — `backend/src/auth/auth-user.ts`:

```json
{
  "id": "uuid", "accountNumber": "B13084", "rank": "SFO2",
  "firstName": "Juan", "middleName": "Santos", "lastName": "Dela Cruz",
  "role": "RADIO_OPERATOR", "officeLevel": "CITY", "districtId": 2, "cityId": 3,
  "mustChangePassword": false,
  "areaCityIds": [3],          // null = all of NCR
  "dispatchCityId": 3,         // null = cannot dispatch
  "officeCityId": 3            // the one city this office runs (city office, FD1/FD5); null = FD II-IV / Regional
}
```

## POST /api/auth/login
- **Access:** Public. `ThrottlerGuard`, limit `LOGIN_RATE_LIMIT` per 60 s (default 10), keyed by client IP.
- **Body:** `{ "accountNumber": string (1–100, trimmed and uppercased), "password": string (1–200) }`. The account number is the sign-in name; there is no username. The format is not checked here (the seeded Super Admin may not follow it). The old `username` field is rejected with 400.
- **200:** `{ "accessToken": string, "expiresIn": number, "user": AuthUser }` and sets the `rcs_rt` cookie.
- **Errors:** 400 validation; 401 `Invalid account number or password` (unknown user, wrong password, disabled or removed account all give the same message); 429 rate limit (`LOGIN_RATE_LIMIT` per client IP), or 429 `Too many failed sign-ins for this account. Try again in N minutes.` after 5 wrong passwords for that account (5-minute pause, any IP).
- **Side effects:** rehashes the password if the hasher's parameters changed.

## POST /api/auth/refresh
- **Access:** Public; reads the `rcs_rt` cookie.
- **Body:** none.
- **200:** same shape as login; sets a new (rotated) `rcs_rt` cookie.
- **Errors:** 401 `Not signed in` (no cookie); 401 from the library for an invalid, expired or reused token (reuse revokes the whole token family); 401 `Account is disabled` if the user is inactive or removed. On any error the cookie is cleared.

## POST /api/auth/logout
- **Access:** Public; reads the `rcs_rt` cookie.
- **204**, no body. Revokes the cookie's token family (errors ignored) and clears the cookie.

## GET /api/auth/me
- **Access:** any signed-in user (`@Can.Anyone()`), including one with `mustChangePassword`.
- **200:** `AuthUser`.

## POST /api/auth/change-password
- **Access:** any signed-in user (`@Can.Anyone()`).
- **Body:** `{ "currentPassword": string (≤200), "newPassword": string (8–200) }`
- **200:** same shape as login. `mustChangePassword` becomes `false`; **all** refresh tokens of the user are revoked and a new pair is issued; sets the cookie.
- **Errors:** 400 `Current password is incorrect`; 400 `New password must be different`; 400 validation; 401 no token.
