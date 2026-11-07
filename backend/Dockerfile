FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:24-slim
WORKDIR /app
# Prisma's migration engine needs OpenSSL, which the slim image lacks.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package*.json ./
# --include=dev: NODE_ENV=production would skip devDependencies, but the seed run on every start needs tsx and barangay.
# shortcut: dev dependencies ship in the runtime image; split the seed into its own image/step to slim it.
RUN npm ci --include=dev
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./
# The seed runs on every start (tsx prisma/seed.ts) and imports these sources: the Prisma client generated in the
# build stage (src/generated is .dockerignored) and the point-in-city helper.
COPY --from=build /app/src/generated ./src/generated
COPY src/geo/city-locator.ts ./src/geo/city-locator.ts
# Apply pending migrations, seed missing reference data, then start.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
