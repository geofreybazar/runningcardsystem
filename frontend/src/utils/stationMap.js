// Truck labels are passed in (constants/truck.js imports @shared, which node:test can't resolve).
import { districtName } from "./permissions.js";

/** Truck lines in a tooltip before "+N more": the tooltip stays readable over the map. */
export const MAX_TRUCK_LINES = 6;

const available = (s) => s.trucks.filter((t) => t.status === "AVAILABLE").length;

const truckLine = (t, labels) => {
  const deployment = t.status === "DEPLOYED" && t.deploymentUnits?.[0]?.deployment?.name;
  const status = labels.statuses[t.status]?.label ?? t.status;
  return [t.callSign, labels.types[t.type] ?? t.type, `${status}${deployment ? ` (${deployment})` : ""}`].join(" · ");
};

/**
 * One pin per station for the Station Map, in its district colour; grey (`dimmed`) when no truck is available.
 * The hover card: city and district, address, contact, truck counts, then one line per truck.
 * `labels`: { types: TRUCK_TYPES, statuses: TRUCK_STATUS } from constants/truck.js.
 */
export const stationMarkers = (stations, labels) =>
  stations
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => {
      const lines = s.trucks.map((t) => truckLine(t, labels));
      const extra = lines.length - MAX_TRUCK_LINES;
      return {
        id: s.id,
        position: { lat: s.lat, lng: s.lng },
        color: s.district.color,
        dimmed: available(s) === 0,
        title: s.name,
        details: [
          [s.city?.name, districtName(s.district)].filter(Boolean).join(" · "),
          s.address,
          s.contactNumber && `Tel. ${s.contactNumber}`,
          s.trucks.length ? `Trucks: ${available(s)} available of ${s.trucks.length}` : "No trucks",
          ...(extra > 0 ? [...lines.slice(0, MAX_TRUCK_LINES - 1), `+${extra + 1} more`] : lines),
        ].filter(Boolean),
      };
    });

/** Stations whose name contains `search` (any case). */
export const searchStations = (stations, search) => {
  const q = search.trim().toLowerCase();
  return q ? stations.filter((s) => s.name.toLowerCase().includes(q)) : stations;
};

/** "156 stations · 140 with an available truck" */
export const stationMapSummary = (stations) => {
  const ready = stations.filter((s) => available(s) > 0).length;
  return `${stations.length} station${stations.length === 1 ? "" : "s"} · ${ready} with an available truck`;
};
