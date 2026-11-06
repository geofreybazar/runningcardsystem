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
- The runtime stage runs `npm ci` (dev dependencies included), copies `dist/`, `prisma/` and `prisma.config.ts`, and sets `NODE_ENV=production`.
- Start command: `npx prisma migrate deploy && npx prisma db seed && node dist/main.js`. Migrations and the re-runnable seed run on **every start**.
- **Known defect (from reading the files):** the runtime stage copies `dist/`, `prisma/` and `prisma.config.ts` but **not `src/`**. `prisma db seed` runs `tsx prisma/seed.ts`, which imports `../src/generated/prisma/client.js` and `../src/geo/city-locator.js`. Those paths do not exist in the runtime image (and `src/generated` is also in `.dockerignore`), so the seed should fail. Because the start command chains with `&&`, the API would not start. Fix by copying the needed sources into the runtime image or running the seed from the build stage. Not yet confirmed by running the image.

## Frontend image (`frontend/Dockerfile`, `nginx.conf`)

- `node:24-slim` build with `VITE_GOOGLE_API` as a build arg, then `nginx:1.27-alpine` serving `dist/`.
- `location /api/` → `proxy_pass http://backend:3000` with `Host`, `X-Forwarded-For` and `X-Forwarded-Proto` headers; `location /` → SPA fallback to `index.html`.

## Production checklist (from code behavior)

- Serve over **HTTPS**. With `NODE_ENV=production` the refresh cookie is `Secure`, so sign-in breaks over plain HTTP unless `COOKIE_SECURE=false` (not recommended).
- Set a strong `JWT_SECRET`; set real `SUPERADMIN_*` values, then change the password at first sign-in.
- Set `SEED_PLACEHOLDER_TRUCKS=false` before the first seed of a real database.
- Restrict the Google key by HTTP referrer and API.
- Review [security gaps](../security/gaps.md): proxy IP for rate limiting, Swagger exposure, security headers.
- Restart the API after re-seeding city boundaries (in-process cache).
