# Deployment

> **Needs Verification:** none of the Docker artifacts have been built or run in the environment where this documentation was written.

## Docker Compose (`docker-compose.yml`)

| Service | Image / build | Notes |
|---|---|---|
| `db` | `postgres:16` | user/password/db set in the compose file; volume `pgdata`; healthcheck `pg_isready`; no host port published |
| `backend` | `./backend` (`Dockerfile`) | `env_file: ./backend/.env`; overrides `DATABASE_URL` to the `db` service and `FRONTEND_ORIGIN` to `http://localhost:8080`; waits for a healthy `db` |
| `osrm` | `ghcr.io/project-osrm/osrm-backend` (pinned) | road router for the running card, internal only; reads the graph from `deploy/osrm/data` (see below); without it, it idles and the API uses straight-line distances |
| `frontend` | `./frontend` (`Dockerfile`) | build arg `VITE_GOOGLE_API` from the shell or a `.env` next to the compose file; publishes `8080:80` |

```bash
export VITE_GOOGLE_API=…        # browser key
docker compose up --build       # http://localhost:8080
```

The compose file contains a development-style Postgres password; change it for real deployments.

## OSRM road graph (`deploy/osrm/`)

The running card ranks stations by road distance ([routing](../modules/routing.md)). The `osrm` service needs a road graph built from OpenStreetMap, which is not in git:

```bash
deploy/osrm/prepare.sh          # downloads the Philippines extract, clips to NCR, builds deploy/osrm/data/
docker compose restart osrm     # if the stack is already running
```

- Needs Docker, ~1.5 GB free disk and ~2 GB RAM while it runs (a few minutes). The running `osrm` container needs far less (check with `docker stats`).
- Run it again to pick up new roads (monthly is plenty). It swaps in the new graph only when the build completes.
- Without the graph, `osrm` logs a hint and idles; the API falls back to straight-line distances and the card says so (≈). CD does not build the graph: run the script once on the VPS.
- Dev without Docker: leave `OSRM_URL` unset in `backend/.env`. To test road distances locally, publish the port (`ports: ["5000:5000"]` in a local override) and set `OSRM_URL=http://localhost:5000`.
- Image version: `docker-compose.yml` and `prepare.sh` must use the same OSRM release (the graph format is versioned).

## Backend image (`backend/Dockerfile`)

- Multi-stage on `node:24-slim`: the build stage runs `npm ci`, `prisma generate`, `npm run build`.
- The runtime stage installs OpenSSL (Prisma's migration engine needs it), sets `NODE_ENV=production`, runs `npm ci --include=dev` (production mode would otherwise skip the seed's `tsx` and `barangay`), and copies `dist/`, `prisma/`, `prisma.config.ts`, the generated Prisma client from the build stage and `src/geo/city-locator.ts` (both imported by the seed). Image size ≈ 1.4 GB because of the dev dependencies (gap #16).
- Because the image sets `NODE_ENV=production`, Swagger is off and the refresh cookie is `Secure`. Browsers accept it on `http://localhost:8080`; from another machine over plain HTTP set `COOKIE_SECURE=false` and `FRONTEND_ORIGIN` to that address (or serve HTTPS).
- `docker-compose.yml` also sets `SWAGGER=false` (explicit) and `TRUST_PROXY=1` (nginx is one hop in front).
- Start command: `npx prisma migrate deploy && npx prisma db seed && node dist/main.js`. Migrations and the re-runnable seed run on **every start**.
- **Tested 2026-11-07** with `docker compose up --build` (Docker 29.9.2 on WSL 2): migrations and seed run on first start and on restart (5 districts, 17 cities, 1,706 barangays, 156 stations); data survives `docker compose restart backend`; through nginx on :8080 the full browser smoke test passed (sign-in, dispatch, live notifications over SSE, raise, close); `/api/docs` is 404; the login limit counts per real client and a faked `X-Forwarded-For` doesn't get around it; the per-account pause works.
- Fixed while testing: the seed failed first because the runtime image lacked the sources it imports (`src/generated`, `src/geo/city-locator.ts`), then with `spawn tsx ENOENT` because `NODE_ENV=production` made `npm ci` skip dev dependencies.

## Frontend image (`frontend/Dockerfile`, `nginx.conf`)

- Build context is the **repo root** (`docker-compose.yml`), so the image can copy `backend/src/shared` (validation rules shared with the API) next to the frontend; `frontend/Dockerfile.dockerignore` limits the context to `frontend/` and that folder, without `node_modules`, `dist` or `.env`.

- `node:24-slim` build with `VITE_GOOGLE_API` as a build arg, then `nginx:1.27-alpine` serving `dist/`.
- `location /api/` → `proxy_pass http://backend:3000` with `Host`, `X-Forwarded-For` and `X-Forwarded-Proto` headers; `location /` → SPA fallback to `index.html`.
- `location /api/notifications/stream` (Server-Sent Events): same proxy with `proxy_buffering off`, `proxy_cache off`, HTTP/1.1 and `proxy_read_timeout 15m`, so live notifications aren't held in nginx's buffer. Any other proxy in front (load balancer, CDN) needs equivalent settings. Run a single backend process (events are in-process).

## VPS (Hostinger)

One VPS runs everything: `docker-compose.yml` plus the production override `docker-compose.prod.yml`, which
- takes the database password and domain from the root `.env` (template: `.env.example`);
- puts **Caddy** (`deploy/Caddyfile`) in front for HTTPS with automatic Let's Encrypt certificates, and closes the public `:8080`;
- sets `TRUST_PROXY=2` (Caddy → nginx → API) and `restart: unless-stopped` on every service.

The repo layout doesn't matter here: the VPS clones the repo and builds both images from it.

1. **VPS:** Ubuntu 24.04 (Hostinger "Docker" OS template, or install Docker Engine and the compose plugin from docs.docker.com). Compose must be v2.24 or newer (`docker compose version`).
2. **Firewall:** `ufw allow OpenSSH && ufw allow 80 && ufw allow 443/tcp && ufw allow 443/udp && ufw enable`. Also check Hostinger's own firewall in hPanel.
3. **DNS:** an A record for the domain → the VPS IP. Wait until it resolves, or Caddy can't get the certificate.
4. **Code:** `git clone https://github.com/geofreybazar/runningcardsystem.git /opt/runningcardsystem && cd /opt/runningcardsystem`. The VPS runs `main`.
5. **Secrets** (never committed):
   - `cp .env.example .env`, then set `DOMAIN`, `POSTGRES_PASSWORD` (`openssl rand -hex 24`) and `VITE_GOOGLE_API`.
   - `cp backend/.env.example backend/.env`, then set `JWT_SECRET` (`openssl rand -base64 48`), real `SUPERADMIN_ACCOUNT_NUMBER` / `SUPERADMIN_PASSWORD`, and `SEED_PLACEHOLDER_TRUCKS=false` (plus `SEED_STATIONS=false` if offices will enter their own stations). The override sets `DATABASE_URL`, `FRONTEND_ORIGIN` and `TRUST_PROXY`, and the image sets `NODE_ENV=production`.
6. **Road graph:** `deploy/osrm/prepare.sh` (see [OSRM road graph](#osrm-road-graph-deployosrm)).
7. **Start:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`. Migrations and the seed run on start. Open `https://<domain>`, sign in as the Super Admin and change the password.
8. **Google key:** restrict it by HTTP referrer to `https://<domain>/*`.
9. **Backups:** `crontab -e`, then add `30 2 * * * /path/to/runningcardsystem/deploy/backup.sh >> /var/log/rcs-backup.log 2>&1`. Dumps go to `backups/` and are kept 14 days. They are still on the same server: copy them off it or enable Hostinger's VPS backups.
   - Restore (into an empty database): `gunzip -c backups/<file>.sql.gz | docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U postgres runningcard`.
10. **Updates:** automatic once [continuous deployment](#continuous-deployment) is set up. By hand: `git pull`, then the same `up -d --build` command (and `deploy/osrm/prepare.sh` now and then for new roads), prefixed with `GIT_COMMIT=$(git rev-parse --short HEAD)` so the About page shows the commit (without it, only the version and build date). Data (`pgdata`) and certificates (`caddy_data`) live in volumes and survive rebuilds.

### Continuous deployment

The `deploy` job in `.github/workflows/ci.yml` runs after the frontend, backend and browser jobs pass on a push to `main`. It SSHes into the VPS, fast-forwards the clone to the tested commit, runs step 10's `up -d --build` with `--wait` (the job fails if a service doesn't come up), and prunes old images. Pull requests never deploy. A newer push to `main` waits for the running deploy instead of cancelling it. The job is skipped until `VPS_HOST` is set.

One-time setup:
1. On the VPS, as root: `adduser --disabled-password deploy && usermod -aG docker deploy`, then `chown -R deploy: /opt/runningcardsystem`. Docker group membership is root-equivalent, so this key gets full control of the VPS: keep it only in GitHub secrets.
2. Make a key just for CI (on your machine): `ssh-keygen -t ed25519 -N '' -C github-deploy -f rcs-deploy`. Append `rcs-deploy.pub` to `/home/deploy/.ssh/authorized_keys` on the VPS.
3. Host key: `ssh-keyscan <vps-ip>` from your machine. Check it against `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` run on the VPS, so you pin the real key.
4. GitHub → Settings → Secrets and variables → Actions:
   - Secrets: `VPS_SSH_KEY` = contents of `rcs-deploy` (private key), `VPS_KNOWN_HOSTS` = the `ssh-keyscan` output.
   - Variables: `VPS_HOST` (IP or hostname), `VPS_USER` = `deploy`, `VPS_PATH` = `/opt/runningcardsystem`.
5. Delete the local `rcs-deploy` private key, push to `main`, and watch the `deploy` job.

Rollback: `git revert` the bad commit and push; CD deploys the revert. Migrations only run forward, so a revert doesn't undo a schema change.

Notes:
- Changing `POSTGRES_PASSWORD` after the first start has no effect on the existing database (Postgres reads it only on initialization); change it with `ALTER USER` as well.
- nginx sends `X-Forwarded-Proto: http` to the API (it is behind Caddy). The API doesn't read it; the cookie's `Secure` flag comes from `NODE_ENV`.
- **Tested 2026-11-08** locally with `DOMAIN=localhost` (Caddy's internal CA; Docker 29.9.2, Compose v5.6.1): HTTPS 200, HTTP → HTTPS redirect, `:8080` closed; sign-in sets `rcs_rt` with `HttpOnly; Secure`, refresh works; dispatch works and the live notification arrives over SSE through Caddy and nginx; the audit log records the real client IP, and a faked `X-Forwarded-For` is ignored (Caddy replaces it); `deploy/backup.sh` dumps and the dump restores (156 stations). Missing `DOMAIN` / `POSTGRES_PASSWORD` stop compose with a clear error. Not yet run on a real VPS with a public certificate. Re-test after changing the override, the Caddyfile or the Dockerfiles.

## Production checklist (from code behavior)

- Serve over **HTTPS**. With `NODE_ENV=production` the refresh cookie is `Secure`, so sign-in breaks over plain HTTP unless `COOKIE_SECURE=false` (not recommended).
- Set a strong `JWT_SECRET`; set real `SUPERADMIN_*` values, then change the password at first sign-in.
- Set `SEED_PLACEHOLDER_TRUCKS=false` before the first seed of a real database.
- Restrict the Google key by HTTP referrer and API.
- Review [security gaps](../security/gaps.md): proxy IP for rate limiting, Swagger exposure, security headers.
- Restart the API after re-seeding city boundaries (in-process cache).
