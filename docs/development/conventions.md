# Coding conventions

Observed in the code; follow them when changing it.

## Backend

- **ESM only** (NestJS 12): relative imports end in `.js`, no `__dirname` (use `import.meta`), tests use Vitest (`vi.fn()`). See `backend/AGENTS.md` for Nest 12's first-party packages.
- **Routes must declare access.** The authorization guard denies by default: add `@Can(AccessPolicy, '<ability>')`, `@Can.Anyone()` or `@Public()`. New abilities go in `src/auth/access.policy.ts`; their user parameter must be typed `AuthUser | null`.
- **Record-level rules live in services**, after loading the record: `await this.authz.authorize(AccessPolicy, 'editCity' | 'dispatchIn', user, cityId)`.
- **Office logic stays in one place:** `src/auth/area.ts` (`OFFICE_LEVELS`, `areaCityIds`, `dispatchCityId`). The frontend copy is `frontend/src/utils/permissions.js` (+ `constants/office.js`); keep the two in sync.
- **Validation** uses Zod schemas (`z.strictObject`, so unknown fields → 400) on `@Body({ schema })` / `@Query({ schema })`, enforced by the global `StandardSchemaValidationPipe`; export `type XDto = z.infer<typeof xSchema>`.
- **Shared rules:** request bodies that a form also fills (users, stations, trucks, settings, change password) are defined once in `backend/src/shared/validation.ts` and imported by both the API (DTO files re-export them) and the web app (`@shared/validation`, form errors under each field before saving). That file must import **only `zod`**: the frontend bundles it. Its enum lists mirror the Prisma enums; `validation.spec.ts` fails if they drift. The server still validates every request. Don't use class-validator (Nest runs one validation approach per app). List fields explicitly in Prisma `data` rather than spreading the DTO.
- **Race-safe writes:** conditional `updateMany` + check `count` (see `IncidentsService.dispatch`).
- **Soft delete** users (`deletedAt`), stations and trucks (`isActive`).
- **Audit** changes to users, stations, trucks, barangay pins and settings with `AuditService.log()`.
- **Env read at import time** (e.g. `LOGIN_RATE_LIMIT` in a decorator) works because `main.ts` imports `dotenv/config` first.
- Code comments explain *why*; deliberate limitations are marked `shortcut: <limit>, <when to upgrade>`.
- Formatting: Prettier (`singleQuote`, `trailingComma: all`). Lint: `npm run lint` (oxlint, type-aware).

## Frontend

- JSX, function components, hooks; the `@/` alias for `src/`.
- **UI components:** shadcn/ui in `src/components/ui/` are generated (`npx shadcn@latest add …`). Don't hand-edit them; they are excluded from ESLint. They require React 19.
- **App building blocks:** `Page`, `Field`, `SimpleSelect` (keeps numeric values), `ConfirmDialog`, `TruckStatusBadge`.
- **Styling:** Tailwind v4 with theme tokens from `src/index.css` (`bg-primary`, `text-muted-foreground`, `bg-gold`), not raw colors. District colors come from the API.
- **Data access:** `service/<domain>.service.js` (the only callers of `api()`) → `hooks/<domain>/useX.js` (one query or mutation each) → components. Pages stay thin; feature parts go in `components/features/<feature>/`. Show action results with `toast` (sonner) and form errors with `Alert`.
- **Permissions in UI** use `src/utils/permissions.js` helpers and `NAV` role lists, for display only.
- Responsive: tables for `md+`, cards below.
