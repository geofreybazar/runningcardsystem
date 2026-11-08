# Local development setup

## Prerequisites

- Node.js 20+ (`@nestjs/core` engines `>= 20`; development has been done on Node 24)
- PostgreSQL (16 in `docker-compose.yml`). The database user needs `CREATEDB` for `prisma migrate dev` (it creates a temporary shadow database).
- A Google Maps Platform browser key with **Maps JavaScript API**, **Places API (New)** and **Geocoding API** enabled.

## Environment variables

Names only; see the `.env.example` files for placeholders. Real `.env` files are gitignored.

**`backend/.env`**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Prisma + `PrismaPg`) |
| `TEST_DATABASE_URL` | database for e2e tests; **wiped on every run**; name must end in `_test` |
| `JWT_SECRET` | access-token signing key (at least 32 bytes) |
| `FRONTEND_ORIGIN` | allowed CORS origin |
| `PORT` | API port (default 3000) |
| `SUPERADMIN_ACCOUNT_NUMBER`, `SUPERADMIN_PASSWORD` | first Super Admin (sign-in name and password), created by the seed. Renamed from `SUPERADMIN_USERNAME`: rename it in an existing `backend/.env` |
| `SEED_PLACEHOLDER_TRUCKS` | `true` adds one placeholder engine per seeded station |
| `LOGIN_RATE_LIMIT` | sign-in attempts per client IP per minute (default 30) |
| `GLOBAL_RATE_LIMIT` | requests per client IP per minute on every route (default 600) |
| `TRUST_PROXY` | set only behind a reverse proxy: hop count (`1`) or proxy addresses; rate limits then see the real client IP |
| `SWAGGER` | `true`/`false` for the `/api/docs` UI; default on unless `NODE_ENV=production` |
| `COOKIE_SECURE` | optional override of the refresh cookie `Secure` flag |

**`frontend/.env`**

| Variable | Purpose |
|---|---|
| `VITE_GOOGLE_API` | Google Maps browser key (embedded in the build) |

The Vite dev server also reads `API_URL` from the shell (proxy target, default `http://localhost:3000`).

## First run

```bash
# backend
cd backend
cp .env.example .env          # then fill in values
npm install
npx prisma migrate dev        # apply migrations
npx prisma generate           # generate the client into src/generated/prisma
npx prisma db seed            # districts, cities, barangays, boundaries, stations, settings, super admin
npm run start:dev             # http://localhost:3000/api   (Swagger UI: /api/docs)

# frontend (second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

Sign in with the seeded Super Admin; you will be asked to change the password.

## Commands

| Where | Command | Does |
|---|---|---|
| backend | `npm run start:dev` | watch mode |
| backend | `npm run build` / `npm run start:prod` | compile to `dist/` / run it |
| backend | `npm run lint` | oxlint (type-aware) on `src/` and `test/` |
| backend | `npm run format` | Prettier |
| backend | `npm test` | Vitest unit tests (`**/*.spec.ts`) |
| backend | `npm run test:e2e` | API tests (`**/*.e2e-spec.ts`); wipes `TEST_DATABASE_URL` |
| backend | `npx prisma migrate dev --name <x>` | new migration |
| backend | `npx prisma generate` | regenerate the client (needed after schema changes in Prisma 7) |
| backend | `npx prisma db seed` | re-runnable seed |
| frontend | `npm run dev` / `build` / `preview` | Vite |
| frontend | `npm run lint` | ESLint (ignores `dist`, `src/components/ui`) |
| frontend | `npm test` | `node --test` (pure helpers) |
| frontend | `npx shadcn@latest add <component>` | add a shadcn/ui component into `src/components/ui/` |

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push to `main` and every pull request: frontend `lint`, `test`, `build`; backend `prisma generate`, `lint`, `test`, `build`, `test:e2e` against a throwaway `postgres:16` service (`runningcard_test`). No deploy step.

## Notes

- Prisma blocks `prisma migrate reset` when it detects an AI agent unless the user consents explicitly.
- `CityDirectory` caches cities and boundaries per process. Restart the API after re-seeding boundaries.
