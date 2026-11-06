# Module: districts

`backend/src/districts/` · API: [districts](../api/districts.md)

- `DistrictsController` only (no service), class-level `@Can(AccessPolicy, 'operate')`:
  - `GET /districts`: districts with their cities.
  - `GET /cities/:id/barangays`
  - `PUT /barangays/:id/location`: first pin open to any signed-in user; overwrite requires `editCity` and is audited.
- Depends on: `PrismaService`, `AuthorizationService`, `AuditService`.
- Reference data comes from the seed; there are no endpoints to create or edit districts, cities or barangay names.
