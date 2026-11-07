# Deployment

> **Needs Verification:** none of the Docker artifacts have been built or run in the environment where this documentation was written.

## Docker Compose (`docker-compose.yml`)

| Service | Image / build | Notes |
|---|---|---|
| `db` | `postgres:16` | user/password/db set in the compose file; volume `pgdata`; healthcheck `pg_isready`; no host port published |
| `backend` | `./backend` (`Dockerfile`) | `env_file: ./backend/.env`; overrides `DATABASE_URL` to the `db` service and `FRONTEND_ORIGIN` to `http://localhost:8080`; waits for a healthy `db` |
| `frontend` | `./frontend` (`Dockerfile`) | build arg `VITE_GOOGLE_API` from the shell or a `.env` next to the compose file; publishes `8080:80` |

```bash
export VITE_GOOGLE_API=…        # browser key
docker compose up --build       # http://localhost:8080
```

The compose file contains a development-style Postgres password; change it for real deployments.

## Backend image (`backend/Dockerfile`)

- Multi-stage on `node:24-slim`: the build stage runs `npm ci`, `prisma generate`, `npm run build`.
- The runtime stage installs OpenSSL (Prisma's migration engine needs it), sets `NODE_ENV=production`, runs `npm ci --include=dev` (production mode would otherwise skip the seed's `tsx` and `barangay`), and copies `dist/`, `prisma/`, `prisma.config.ts`, the generated Prisma client from the build stage and `src/geo/city-locator.ts` (both imported by the seed). Image size ≈ 1.4 GB because of the dev dependencies (gap #16).
- Because the image sets `NODE_ENV=production`, Swagger is off and the refresh cookie is `Secure`. Browsers accept it on `http://localhost:8080`; from another machine over plain HTTP set `COOKIE_SECURE=false` and `FRONTEND_ORIGIN` to that address (or serve HTTPS).
- `docker-compose.yml` also sets `SWAGGER=false` (explicit) and `TRUST_PROXY=1` (nginx is one hop in front).
- Start command: `npx prisma migrate deploy && npx prisma db seed && node dist/main.js`. Migrations and the re-runnable seed run on **every start**.
- **Tested 2026-11-07** with `docker compose up --build` (Docker 29.9.2 on WSL 2): migrations and seed run on first start and on restart (5 districts, 17 cities, 1,706 barangays, 156 stations); data survives `docker compose restart backend`; through nginx on :8080 the full browser smoke test passed (sign-in, dispatch, live notifications over SSE, raise, close); `/api/docs` is 404; the login limit counts per real client and a faked `X-Forwarded-For` doesn't get around it; the per-account pause works.
- Fixed while testing: the seed failed first because the runtime image lacked the sources it imports (`src/generated`, `src/geo/city-locator.ts`), then with `spawn tsx ENOENT` because `NODE_ENV=production` made `npm ci` skip dev dependencies.

## Frontend image (`frontend/Dockerfile`, `nginx.conf`)

- `node:24-slim` build with `VITE_GOOGLE_API` as a build arg, then `nginx:1.27-alpine` serving `dist/`.
- `location /api/` → `proxy_pass http://backend:3000` with `Host`, `X-Forwarded-For` and `X-Forwarded-Proto` headers; `location /` → SPA fallback to `index.html`.
- `location /api/notifications/stream` (Server-Sent Events): same proxy with `proxy_buffering off`, `proxy_cache off`, HTTP/1.1 and `proxy_read_timeout 15m`, so live notifications aren't held in nginx's buffer. Any other proxy in front (load balancer, CDN) needs equivalent settings. Run a single backend process (events are in-process).

## Production checklist (from code behavior)

- Serve over **HTTPS**. With `NODE_ENV=production` the refresh cookie is `Secure`, so sign-in breaks over plain HTTP unless `COOKIE_SECURE=false` (not recommended).
- Set a strong `JWT_SECRET`; set real `SUPERADMIN_*` values, then change the password at first sign-in.
- Set `SEED_PLACEHOLDER_TRUCKS=false` before the first seed of a real database.
- Restrict the Google key by HTTP referrer and API.
- Review [security gaps](../security/gaps.md): proxy IP for rate limiting, Swagger exposure, security headers.
- Restart the API after re-seeding city boundaries (in-process cache).
