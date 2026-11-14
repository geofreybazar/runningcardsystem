import { test } from "node:test";
import assert from "node:assert/strict";
import { areaDistricts, formatMinutes, heatStep, presetRange } from "./stats.js";

test("formatMinutes", () => {
  assert.equal(formatMinutes(null), "—");
  assert.equal(formatMinutes(45.4), "45 min");
  assert.equal(formatMinutes(80), "1 h 20 min");
  assert.equal(formatMinutes(180), "3 h");
});

test("heatStep spreads counts over the 5 ramp steps, 0 stays empty", () => {
  assert.deepEqual([0, 1, 2, 5, 9, 10].map((v) => heatStep(v, 10)), [0, 1, 1, 3, 5, 5]);
  assert.equal(heatStep(3, 0), 0);
});

test("presetRange counts today as the last day", () => {
  const today = new Date(2026, 10, 8); // Nov 8 local
  assert.deepEqual(presetRange("7d", today), { from: "2026-11-02", to: "2026-11-08" });
  assert.deepEqual(presetRange("30d", today), { from: "2026-10-10", to: "2026-11-08" });
  assert.deepEqual(presetRange("year", today), { from: "2026-01-01", to: "2026-11-08" });
});

test("areaDistricts: regional sees all; a district its cities; a city office its one city", () => {
  const districts = [
    { id: 1, cities: [{ id: 10 }] },
    { id: 2, cities: [{ id: 20 }, { id: 21 }, { id: 22 }] },
  ];
  assert.equal(areaDistricts(districts, null), districts);
  assert.deepEqual(areaDistricts(districts, [20, 21, 22]), [{ ...districts[1], narrowed: false }]);
  assert.deepEqual(areaDistricts(districts, [21]), [{ id: 2, cities: [{ id: 21 }], narrowed: true }]);
  assert.deepEqual(areaDistricts(districts, []), []);
});
