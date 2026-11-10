# Build context: the repo root (docker-compose.yml), so the validation rules shared with the API can be copied in.
FROM node:24-slim AS build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Imported through the @shared alias (vite.config.js), at the same relative path as in the repo.
COPY backend/src/shared ../backend/src/shared
# The Maps key is baked into the static build.
ARG VITE_GOOGLE_API
ENV VITE_GOOGLE_API=$VITE_GOOGLE_API
# Commit shown on the About page (the build has no .git): GIT_COMMIT=$(git rev-parse --short HEAD) docker compose ... --build
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT
RUN npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
