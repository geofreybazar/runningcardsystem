# Users API

Controller `UsersController` (`backend/src/users/users.controller.ts`), class-level `@Can(AccessPolicy, 'manageUsers')` (SUPER_ADMIN, ADMIN). Service `UsersService` (`users.service.ts`). DTOs in `users.dto.ts`.

**Role check on every write:** `canManageRole(actor, role)`: SUPER_ADMIN manages every role; ADMIN manages every role except SUPER_ADMIN. Denied → 403 `You cannot manage <ROLE> accounts`.

**Office rules** (`UsersService.office()`, `OFFICE_LEVELS` in `src/auth/area.ts`):

| Role | Allowed `officeLevel` |
|---|---|
| SUPER_ADMIN, ADMIN | REGIONAL |
| OPERATIONS | DISTRICT, CITY |
| RADIO_OPERATOR | REGIONAL, DISTRICT, CITY |

REGIONAL stores no district/city. DISTRICT requires a valid `districtId` (city cleared). CITY requires a valid `cityId`; `districtId` is set from the city. Violations → 400.

**User object** (`PUBLIC_FIELDS`):

```json
{
  "id": "uuid", "username": "…", "fullName": "…", "role": "OPERATIONS",
  "officeLevel": "CITY", "districtId": 2, "district": { "code": 2, "name": "Fire District 2", "alias": "CAMANAVA" },
  "cityId": 3, "city": { "name": "Caloocan" },
  "isActive": true, "mustChangePassword": true, "createdAt": "ISO-8601"
}
```

## GET /api/users
- **200:** `User[]`, non-removed users ordered by `username`. No pagination.

## POST /api/users
- **Body:**
  | Field | Rules |
  |---|---|
  | `username` | 3–50, `^[a-zA-Z0-9._-]+$` |
  | `fullName` | 1–120 |
  | `role` | `Role` enum |
  | `officeLevel` | optional `OfficeLevel`, default REGIONAL |
  | `districtId`, `cityId` | optional int or null |
- **201:** `{ "user": User, "temporaryPassword": string }`. The password is 12 random base64url characters, shown only in this response; `mustChangePassword = true`.
- **Errors:** 400 validation/office; 403 role check; 409 `Username is already taken`.
- **Audit:** `CREATE User`.

## PATCH /api/users/:id
- `:id` UUID.
- **Body (all optional):** `fullName`, `role`, `officeLevel`, `districtId`, `cityId`, `isActive`.
- If any of `role`, `officeLevel`, `districtId`, `cityId` is present, the office is re-validated with the target's stored values filling the gaps.
- **200:** `User`.
- **Errors:** 400 `You cannot change your own role or disable yourself`; 400 office; 403 role check (on the current role and on the new role); 404 `User not found`.
- **Side effects:** `isActive: false` revokes all of the user's refresh tokens. The access token stops working on the next request, because users are reloaded every request.
- **Audit:** `DISABLE` when `isActive: false`, else `UPDATE`; `changes` = request body.

## POST /api/users/:id/reset-password
- **200:** `{ "temporaryPassword": string }`; sets `mustChangePassword = true`, revokes all refresh tokens.
- **Errors:** 403, 404. Resetting your own password is not blocked.
- **Audit:** `RESET_PASSWORD`.

## DELETE /api/users/:id
- **204.** Soft delete: `deletedAt = now`, `isActive = false`, username renamed to `<username>#deleted-<epoch ms>`; refresh tokens revoked.
- **Errors:** 400 `You cannot remove your own account`; 403; 404.
- **Audit:** `DELETE` with the original username.
