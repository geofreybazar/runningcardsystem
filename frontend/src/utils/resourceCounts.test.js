import { test } from "node:test";
import assert from "node:assert/strict";
import { resourceCounts } from "./resourceCounts.js";

const TYPES = ["ENGINE", "AMBULANCE"];
const d2 = { id: 2, code: 2, name: "Fire District II", color: "#00f" };
const d1 = { id: 1, code: 1, name: "Manila Fire District", color: "#f80" };
const station = (district, city, trucks) => ({ district, city, trucks });
const STATIONS = [
  station(d2, { id: 10, name: "Malabon" }, [
    { type: "ENGINE", status: "AVAILABLE" },
    { type: "AMBULANCE", status: "RESPONDING" },
  ]),
  station(d2, { id: 11, name: "Caloocan" }, [
    { type: "ENGINE", status: "OUT_OF_SERVICE" },
    { type: "ENGINE", status: "AVAILABLE" },
  ]),
  station(d1, { id: 1, name: "Manila" }, [{ type: "ENGINE", status: "DEPLOYED" }]),
];

test("groups by city, sorted by name, with available of total per type", () => {
  const { rows, sum } = resourceCounts(STATIONS.slice(0, 2), "city", TYPES);
  assert.deepEqual(
    rows.map((r) => r.label),
    ["Caloocan", "Malabon"],
  );
  assert.equal(rows[0].byType.ENGINE.available, 1);
  assert.equal(rows[0].byType.ENGINE.total, 2);
  assert.deepEqual(rows[0].byType.ENGINE.statuses, { OUT_OF_SERVICE: 1, AVAILABLE: 1 });
  assert.deepEqual(rows[1].byType.AMBULANCE, { available: 0, total: 1, statuses: { RESPONDING: 1 } });
  assert.deepEqual(sum.total, { available: 2, total: 4 });
});

test("groups by district in district order", () => {
  const { rows, sum } = resourceCounts(STATIONS, "district", TYPES);
  assert.deepEqual(
    rows.map((r) => r.label),
    ["Manila Fire District", "Fire District II"],
  );
  assert.deepEqual(rows[0].total, { available: 0, total: 1 });
  assert.deepEqual(sum.byType.ENGINE, { available: 2, total: 4, statuses: { AVAILABLE: 2, OUT_OF_SERVICE: 1, DEPLOYED: 1 } });
});

test("stations without a city share one row", () => {
  const { rows } = resourceCounts([station(d2, null, [{ type: "ENGINE", status: "AVAILABLE" }])], "city", TYPES);
  assert.equal(rows[0].label, "No city set");
});
