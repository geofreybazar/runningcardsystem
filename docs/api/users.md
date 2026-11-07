# Users API

Controller `UsersController` (`backend/src/users/users.controller.ts`), class-level `@Can(AccessPolicy, 'manageUsers')` (SUPER_ADMIN, ADMIN). Service `UsersService` (`users.service.ts`). DTOs in `users.dto.ts`.

**Role check on every write:** `canManageRole(actor, role)`: SUPER_ADMIN manages every role; ADMIN manages every role except SUPER_ADMIN. Denied → 403 `You cannot manage <ROLE> accounts`.

**Office rules** (`UsersService.office()`, `OFFICE_LEVELS` in `src/auth/area.ts`):

| Role | Allowed `officeLevel` |
|---|---|
| SUPER_ADMIN, ADMIN | REGIONAL |
| OPERATIONS | DISTRICT, CITY |
| RADIO_OPERATOR | REGIONAL, DISTRICT, CITY |

REGIONAL stores no district/city. DISTRICT requires a valid `districtId` (city cleared). CITY requires a valid `cityId`; `districtId` is set from the city. **Manila (FD1) and Quezon City (FD5) have no city offices**: their accounts are district-level (400 `<city> has no city office; use its fire district office`). Violations → 400.

**User object** (`PUBLIC_FIELDS`):

```json
{
  "id": "uuid", "accountNumber": "B13084", "rank": "SFO2",
  "firstName": "Juan", "middleName": "Santos", "lastName": "Dela Cruz", "role": "OPERATIONS",
  "officeLevel": "CITY", "districtId": 2, "district": { "code": 2, "name": "Fire District 2", "alias": "CAMANAVA" },
  "cityId": 3, "city": { "name": "Caloocan" },
  "isActive": true, "mustChangePassword": true, "createdAt": "ISO-8601"
}
```

## GET /api/users
- **200:** `User[]`, non-removed users ordered by `lastName`, `firstName`. No pagination.

## POST /api/users
- **Body:**
  | Field | Rules |
  |---|---|
  | `rank` | `Rank` enum; required unless `role` is `SUPER_ADMIN` (stored as null for Super Admin) |
  | `firstName`, `lastName` | 1–60 after trim |
  | `middleName` | optional, ≤ 60; blank → null |
  | `accountNumber` | `^[A-Z]{1,3}\d{4,8}$` after trim + uppercase (e.g. `B13084`). It is the user's sign-in name |
  | `role` | `Role` enum |
  | `officeLevel` | optional `OfficeLevel`, default REGIONAL |
  | `districtId`, `cityId` | optional int or null |
- **201:** `{ "user": User, "temporaryPassword": string }`. The password is 12 random base64url characters, shown only in this response; `mustChangePassword = true`.
- **Errors:** 400 validation/office; 403 role check; 409 `Account number is already registered`.
- **Audit:** `CREATE User`.

## PATCH /api/users/:id
- `:id` UUID.
- **Body (all optional):** `rank`, `firstName`, `middleName`, `lastName`, `accountNumber`, `role`, `officeLevel`, `districtId`, `cityId`, `isActive` (same rules as create).
- `accountNumber` can be changed by Admin/Super Admin; existing sessions stay valid (they are tied to the user id).
- Rank is checked when the body has `rank` or `role`: non-Super-Admin roles must end up with a rank. Accounts migrated without a rank can still be disabled.
- If any of `role`, `officeLevel`, `districtId`, `cityId` is present, the office is re-validated with the target's stored values filling the gaps.
- **200:** `User`.
- **Errors:** 400 `You cannot change your own role or disable yourself`; 400 office; 403 role check (on the current role and on the new role); 404 `User not found`; 409 `Account number is already registered`.
- **Side effects:** `isActive: false` revokes all of the user's refresh tokens. The access token stops working on the next request, because users are reloaded every request.
- **Audit:** `DISABLE` when `isActive: false`, else `UPDATE`; `changes` = request body.

## POST /api/users/:id/reset-password
- **200:** `{ "temporaryPassword": string }`; sets `mustChangePassword = true`, revokes all refresh tokens.
- **Errors:** 403, 404. Resetting your own password is not blocked.
- **Audit:** `RESET_PASSWORD`.

## DELETE /api/users/:id
- **204.** Soft delete: `deletedAt = now`, `isActive = false`, account number renamed to `<accountNumber>#deleted-<epoch ms>` (`#` is not valid in an account number, so it never clashes); refresh tokens revoked.
- **Errors:** 400 `You cannot remove your own account`; 403; 404.
- **Audit:** `DELETE` with the original account number.
