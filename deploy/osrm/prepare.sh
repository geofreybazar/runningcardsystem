#!/usr/bin/env bash
# Builds the road network the osrm service routes on: OpenStreetMap's Philippines extract, clipped to Metro Manila
# plus a margin (edge stations, and routes that leave NCR briefly through Rizal, Cavite or Bulacan), prepared for
# OSRM's MLD algorithm. Run once before the first `docker compose up` with OSRM, then again to pick up new roads
# (monthly is plenty), and restart the service: `docker compose restart osrm`.
# Needs Docker, ~1.5 GB free disk and ~2 GB RAM while it runs. Output: deploy/osrm/data/ (gitignored).
set -euo pipefail

OSRM_IMAGE=ghcr.io/project-osrm/osrm-backend:v5.27.1 # keep in step with docker-compose.yml
BBOX=120.85,14.25,121.25,14.85                      # lng/lat: NCR stations span 120.93-121.13, 14.38-14.78
SOURCE=https://download.geofabrik.de/asia/philippines-latest.osm.pbf

cd "$(dirname "$0")"
mkdir -p data
work=$(mktemp -d "$PWD/build.XXXX")
trap 'rm -rf "$work"' EXIT

echo "Downloading the Philippines extract (~600 MB)..."
curl -fL --retry 3 -o "$work/philippines.osm.pbf" "$SOURCE"

echo "Clipping to Metro Manila..."
docker run --rm -v "$work:/w" debian:12-slim sh -c \
  "apt-get update -qq && apt-get install -y -qq osmium-tool >/dev/null && osmium extract -b $BBOX /w/philippines.osm.pbf -o /w/ncr.osm.pbf"

echo "Preparing the road graph..."
docker run --rm -v "$work:/data" "$OSRM_IMAGE" osrm-extract -p /opt/car.lua /data/ncr.osm.pbf
docker run --rm -v "$work:/data" "$OSRM_IMAGE" osrm-partition /data/ncr.osrm
docker run --rm -v "$work:/data" "$OSRM_IMAGE" osrm-customize /data/ncr.osrm

# Swap in the new graph only once it is complete, so a failed run leaves the old one working.
rm -rf data.old && mv data data.old && mkdir data && mv "$work"/ncr.osrm* data/ && rm -rf data.old
echo "Done: $(du -sh data | cut -f1) in deploy/osrm/data. Restart the service: docker compose restart osrm"
