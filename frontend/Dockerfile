FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# The Maps key is baked into the static build.
ARG VITE_GOOGLE_API
ENV VITE_GOOGLE_API=$VITE_GOOGLE_API
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
