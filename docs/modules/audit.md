# Module: audit

`backend/src/audit/` (global module) · API: [audit](../api/audit.md)

- `AuditService.log(userId | null, action, entity, entityId, changes?, { db?, ip? })` and `list({ entity, take, skip })`. Pass the transaction as `db` so a change and its entry are saved together (all callers that change data do). `userId` is null only for a failed sign-in with an unknown account number; `ip` is recorded for sign-in attempts.
- `AuthAuditListener` (`auth/auth-audit.listener.ts`) subscribes to the authentication library's `events$` for what only the library sees.
- `AuditController`: `GET /audit-logs` (`viewAuditLog`).

What is logged (from the callers):

| Caller | Actions |
|---|---|
| `UsersService` | `CREATE`, `UPDATE`, `DISABLE`, `RESET_PASSWORD`, `DELETE` on `User` |
| `AuthService` | `SIGN_IN`, `SIGN_IN_FAILED` (reason: unknown account number, wrong password, account disabled, paused after repeated failures; with IP) on `Session`; `CHANGE_PASSWORD` on `User` |
| `AuthAuditListener` | `SIGN_OUT`, `TOKEN_REUSED` (a refresh token used twice: possible stolen session) on `Session` |
| `IncidentsService` | `DISPATCH`, `RAISE_ALARM`, `REQUEST_UNIT` (special unit), `CLOSE` on `Incident`, with the alarm level and the trucks sent or released |
| `StationsService` | `CREATE`, `UPDATE`, `DEACTIVATE` on `Station`; `CREATE`, `UPDATE`, `STATUS`, `DELETE` on `Truck` |
| `DistrictsController` | `SET_PIN` (first pin) and `UPDATE` (correction) on `Barangay` |
| `SettingsController` | `UPDATE` on `Settings` (before and after) |

Not logged: reads, "mark notifications seen", and trucks freed automatically when an incident closes (the `CLOSE` entry lists them).
