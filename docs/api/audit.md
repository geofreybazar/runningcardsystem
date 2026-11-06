# Audit log API

Controller `AuditController` (`backend/src/audit/audit.controller.ts`), service `AuditService` (`audit.service.ts`).

## GET /api/audit-logs
- **Access:** `viewAuditLog` (SUPER_ADMIN, ADMIN).
- **Query:** `entity?` string (exact match, e.g. `User`, `Station`, `Truck`, `Barangay`, `Settings`), `take?` int 1–500 (default 100), `skip?` int ≥ 0.
- **200:** newest first:

```json
[{ "id": 1, "userId": "uuid", "action": "CREATE", "entity": "User", "entityId": "uuid",
   "changes": { … } | null, "createdAt": "…",
   "user": { "username": "…", "fullName": "…" } }]
```

What is logged: see [modules/audit](../modules/audit.md). `changes` may include request bodies; it never contains passwords (no password fields are logged by the callers).
