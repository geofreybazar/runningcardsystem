# Module: users

`backend/src/users/` · API: [users](../api/users.md)

- `UsersController`: class-level `@Can(AccessPolicy, 'manageUsers')`.
- `UsersService`:
  - `list()`: non-deleted users with `PUBLIC_FIELDS`.
  - `create()`: role check → `office()` validation → unique account number, rank rule → random temporary password → audit.
  - `update()`: self-protection → role checks on current and new role → office re-validation → revoke tokens on disable → audit.
  - `resetPassword()`, `remove()` (soft delete + account-number rename + revoke).
  - Exported helper `canManageRole(actor, role)`.
- Depends on: `PrismaService`, `PasswordHasher`, `TokenService`, `AuditService`, `CityDirectory`, `OFFICE_LEVELS`.
