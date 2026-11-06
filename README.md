# BFP-NCR Running Card System

Finds which fire stations respond to a fire anywhere in Metro Manila, nearest first, grouped into alarm levels (1st–5th Alarm, Task Forces, General Alarm). Radio operators dispatch from it, and it tracks which trucks are out on which incident.

- **frontend/**: React 19 + Vite + Tailwind v4 + shadcn/ui, Google Maps
- **backend/**: NestJS 12 + Prisma 7 + PostgreSQL, JWT access/refresh tokens

Full technical documentation (architecture, database, API, security, development): [docs/](docs/README.md).

## Offices and roles

Every account belongs to an office: the **Regional** office, a **Fire District** office, or a **City** office.

| Role | Office | Does |
|---|---|---|
| Super Admin | Regional | Developers. Everything, including the running card rules |
| Admin | Regional | Regional IT: creates, disables, removes and resets accounts (all but Super Admin); reads the audit log |
| Operations | District or City | Adds and edits stations and fire trucks **in its city, or every city of its district** |
| Radio Operator | Regional, District or City | City offices, and the FD1 (Manila) and FD5 (Quezon City) district offices, **dispatch, raise alarms and close incidents for fires in their own city**. FD2–FD4 district offices and the Regional office only view incidents |

Offices see the incidents in their area: City → its city, District → its cities, Regional → all. An office also sees incidents its stations responded to. Anyone can preview a running card.

The city of a location comes from the NCR city boundaries in `backend/prisma/seed-data/ncr-city-boundaries.json`, built from barangay outlines in [faeldon/philippines-json-maps](https://github.com/faeldon/philippines-json-maps) (MIT).

New accounts get a temporary password and must change it on first sign-in.

## Location picking

Type an address, landmark, or `latitude, longitude`, **or** pick **Fire District → City → Barangay**:

| District | Cities |
|---|---|
| Fire District 1 (Manila Fire District) | Manila |
| Fire District 2 (CAMANAVA) | Caloocan, Malabon, Navotas, Valenzuela |
| Fire District 3 | Pasay, Makati, Las Piñas, Parañaque, Muntinlupa |
| Fire District 4 | Marikina, Pasig, Pateros, Taguig, Mandaluyong, San Juan |
| Fire District 5 (Quezon City Fire District) | Quezon City |

FD1 and FD5 act as a city, so the city step is filled in for them. A barangay's pin is found with Google the first time it's picked and saved; Operations can correct it.

## Running card rules

Only active stations with at least one **Available** truck are listed (a truck already on an incident is never sent again; the station sends another available truck, or the next nearest station takes its place), nearest first (straight-line distance), 4 per alarm level by default. Each station sends one truck: its first available, or the one the operator picks. Super Admin can change the number of stations per alarm, the max distance and the alarm level names under **Settings**.

Dispatch marks the 1st Alarm trucks **Responding**. **Raise alarm** sends the next nearest stations not yet on the incident. **Close** sets the trucks back to **Available**, except any that Operations marked **Out of service** meanwhile.

## Local development

Needs Node 20+ and PostgreSQL.

```bash
# Backend
cd backend
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, SUPERADMIN_* …
npm install
npx prisma migrate dev        # create tables
npx prisma db seed            # districts, cities, 1,706 barangays, 156 stations, settings, first super admin
npm run start:dev             # http://localhost:3000/api  (API docs: /api/docs)

# Frontend (second terminal)
cd frontend
cp .env.example .env          # VITE_GOOGLE_API (Maps JavaScript, Places API (New), Geocoding)
npm install
npm run dev                   # http://localhost:5173, /api is proxied to the backend
```

Sign in with `SUPERADMIN_USERNAME` / `SUPERADMIN_PASSWORD` from `backend/.env`.

`SEED_PLACEHOLDER_TRUCKS=true` gives every seeded station one placeholder engine so the running card works right away. Set it to `false` before seeding a real database. With no trucks, stations never appear on the card.

## Tests

```bash
cd backend
npm test             # unit tests (running card rules)
npm run test:e2e     # API tests; WIPES and reseeds the database in TEST_DATABASE_URL (name must end in _test)

cd frontend
npm test             # coordinate parsing
```

## Docker

> Untested. The backend image is expected to fail at its seed step; see [docs/development/deployment.md](docs/development/deployment.md).

```bash
export VITE_GOOGLE_API=your-key   # or put it in a .env next to docker-compose.yml
docker compose up --build         # http://localhost:8080
```

This runs Postgres, the API (applies migrations and seeds missing data on start), and the built frontend behind nginx, which proxies `/api`. Serve it over **HTTPS** in production: the refresh cookie is `Secure`. Use `COOKIE_SECURE=false` only on a trusted LAN without HTTPS.
