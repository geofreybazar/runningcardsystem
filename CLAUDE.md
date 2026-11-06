# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BFP-NCR Running Card System: a client-only React 18 + Vite SPA. Given an incident location in Metro Manila (address, landmark, barangay, or lat/long), it lists the nearest fire stations grouped into alarm levels (a "running card"). No backend, no router.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` / `npm run preview` — production build to `dist/` / serve it
- `npm run lint` — ESLint (flat config in `eslint.config.js`; `react/prop-types` is off)
- `npm test` — Node's built-in runner (`node --test`), no deps. Single file: `node --test src/variables/variables.test.js`. Only the pure logic in `variables.js` is tested; components are not.

## Environment

`VITE_GOOGLE_API` in `.env` (gitignored) is the Google Maps JS API key. The key needs Maps JavaScript, Places API (New) (`AutocompleteSuggestion.fetchAutocompleteSuggestions`, rendered in an MUI Autocomplete; the legacy `places.Autocomplete` widget is not available to this key) and Geocoding APIs. The map uses a hardcoded `mapId` (required by `AdvancedMarker`).

## Architecture

`Home.jsx` owns a single `location` state (`{lat, lng}` or null) and wraps everything in `<APIProvider>` so the search box and map share the loaded Google libraries (accessed with `useMapsLibrary` / `useMap`). The running card is derived: `useMemo(() => buildRunningCard(location))`. Every input path just calls `onSelect`/`onChange` with a point:

- `LocationSearch.jsx` — freeSolo MUI Autocomplete fed by Places API (New) suggestions (addresses/landmarks); Enter on free text goes through `parseCoordinates`; a grouped MUI Autocomplete of all NCR barangays (from the `barangay` package, dynamically imported because it bundles the whole country) geocoded with `google.maps.Geocoder`.
- `MapComponent.jsx` — map click and draggable pin; pans to `position` when it changes.
- `Card.jsx` — renders alarm groups; `DISTRICTS` maps `station.district` to label + Tailwind color.

`src/variables/variables.js` (default-export object) holds the data and pure logic: the `fireStations` array (`{ name, long, lat, district }` — note `long`, not `lng`; district must be `firedistrict1`–`5` to get a color), `alarms`, `haversine` (km), `categorizeAlarm` (groups of 4), `buildRunningCard` (≤100 km → sort → categorize → first 10 groups), `parseCoordinates`, and `NCR_BOUNDS` (used both to bias search and reject out-of-NCR coordinates).

## Styling

Tailwind for layout/colors alongside MUI components. Both coexist; follow whichever the surrounding code uses.
