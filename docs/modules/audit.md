# Module: audit

`backend/src/audit/` (global module) · API: [audit](../api/audit.md)

- `AuditService.log(userId, action, entity, entityId, changes?)` and `list({ entity, take, skip })`.
- `AuditController`: `GET /audit-logs` (`viewAuditLog`).

What is logged (from the callers):

| Caller | Actions |
|---|---|
| `UsersService` | `CREATE`, `UPDATE`, `DISABLE`, `RESET_PASSWORD`, `DELETE` on `User` |
| `StationsService` | `CREATE`, `UPDATE`, `DEACTIVATE` on `Station`; `CREATE`, `UPDATE`, `STATUS`, `DELETE` on `Truck` |
| `DistrictsController` | `UPDATE` on `Barangay` (only when overwriting an existing pin) |
| `SettingsController` | `UPDATE` on `Settings` |

Not logged: sign-ins, first barangay pins, incident dispatch/raise/close.
