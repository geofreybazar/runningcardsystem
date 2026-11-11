import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_TRUCK_LINES, searchStations, stationMapSummary, stationMarkers } from "./stationMap.js";

const labels = {
  types: { ENGINE: "Engine", TANKER: "Tanker" },
  statuses: { AVAILABLE: { label: "Available" }, OUT_OF_SERVICE: { label: "Out of service" }, DEPLOYED: { label: "Deployed" } },
};
const district = { code: 1, name: "Fire District 1", color: "#fb923c" };
const truck = (id, status, extra = {}) => ({ id, callSign: `E-${id}`, type: "ENGINE", status, ...extra });
const station = (id, trucks, extra = {}) => ({ id, name: `Station ${id}`, lat: 14.6, lng: 121, district, city: { name: "Manila" }, trucks, ...extra });

test("stationMarkers: pin in district colour with a hover card", () => {
  const [m] = stationMarkers([station(1, [truck(1, "AVAILABLE"), truck(2, "OUT_OF_SERVICE")], { address: "Quiapo", contactNumber: "8527-3653" })], labels);
  assert.deepEqual(m.position, { lat: 14.6, lng: 121 });
  assert.equal(m.color, "#fb923c");
  assert.equal(m.dimmed, false);
  assert.equal(m.title, "Station 1");
  assert.equal(m.details[0].startsWith("Manila · "), true);
  assert.deepEqual(m.details.slice(1), ["Quiapo", "Tel. 8527-3653", "Trucks: 1 available of 2", "E-1 · Engine · Available", "E-2 · Engine · Out of service"]);
});

test("stationMarkers: grey without an available truck; deployed trucks name the event", () => {
  const deployed = truck(3, "DEPLOYED", { deploymentUnits: [{ deployment: { name: "SONA 2026" } }] });
  const [m] = stationMarkers([station(1, [deployed])], labels);
  assert.equal(m.dimmed, true);
  assert.equal(m.details.at(-1), "E-3 · Engine · Deployed (SONA 2026)");
  assert.equal(stationMarkers([station(2, [])], labels)[0].details.at(-1), "No trucks");
});

test("stationMarkers: long truck lists end with +N more; stations without coordinates are skipped", () => {
  const many = Array.from({ length: MAX_TRUCK_LINES + 3 }, (_, i) => truck(i, "AVAILABLE"));
  const [m] = stationMarkers([station(1, many), station(2, [], { lat: null })], labels);
  const truckLines = m.details.filter((d) => d.startsWith("E-") || d.startsWith("+"));
  assert.equal(truckLines.length, MAX_TRUCK_LINES);
  assert.equal(truckLines.at(-1), "+4 more");
  assert.equal(stationMarkers([station(2, [], { lat: null })], labels).length, 0);
});

test("search and summary", () => {
  const list = [station(1, [truck(1, "AVAILABLE")]), station(22, [truck(2, "OUT_OF_SERVICE")])];
  assert.deepEqual(searchStations(list, " station 2").map((s) => s.id), [22]);
  assert.equal(searchStations(list, "").length, 2);
  assert.equal(stationMapSummary(list), "2 stations · 1 with an available truck");
});
