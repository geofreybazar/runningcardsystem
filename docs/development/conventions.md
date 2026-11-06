# Coding conventions

Observed in the code; follow them when changing it.

## Backend

- **ESM only** (NestJS 12): relative imports end in `.js`, no `__dirname` (use `import.meta`), tests use Vitest (`vi.fn()`). See `backend/AGENTS.md` for Nest 12's first-party packages.
- **Routes must declare access.** The authorization guard denies by default: add `@Can(AccessPolicy, '<ability>')`, `@Can.Anyone()` or `@Public()`. New abilities go in `src/auth/access.policy.ts`; their user parameter must be typed `AuthUser | null`.
- **Record-level rules live in services**, after loading the record: `await this.authz.authorize(AccessPolicy, 'editCity' | 'dispatchIn', user, cityId)`.
- **Office logic stays in one place:** `src/auth/area.ts` (`OFFICE_LEVELS`, `areaCityIds`, `dispatchCityId`). The frontend copy is `frontend/src/auth/permissions.js`; keep the two in sync.
- **DTOs** use class-validator; the global pipe forbids unknown fields. Do not spread DTO class instances into Prisma `data` (oxlint `no-misused-spread`); list fields explicitly.
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
- **Data access:** only through `api()` in `src/api/client.js`. Show action results with `toast` (sonner) and form errors with `Alert`.
- **Permissions in UI** use `src/auth/permissions.js` helpers and `NAV` role lists, for display only.
- Responsive: tables for `md+`, cards below.
