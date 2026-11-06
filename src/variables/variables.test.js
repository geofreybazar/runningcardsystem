import { test } from "node:test";
import assert from "node:assert/strict";
import variables from "./variables.js";

const { parseCoordinates, buildRunningCard } = variables;

test("parseCoordinates accepts common formats", () => {
  const expected = { lat: 14.591623, lng: 121.003091 };
  assert.deepEqual(parseCoordinates("14.591623, 121.003091"), expected);
  assert.deepEqual(parseCoordinates("14.591623,121.003091"), expected);
  assert.deepEqual(parseCoordinates("  14.591623 121.003091 "), expected);
});

test("parseCoordinates rejects garbage and points outside NCR", () => {
  assert.equal(parseCoordinates("SM North EDSA"), null);
  assert.equal(parseCoordinates("14.59"), null);
  assert.equal(parseCoordinates("121.00, 14.59"), null); // swapped
  assert.equal(parseCoordinates("10.3, 123.9"), null); // Cebu
});

test("buildRunningCard groups nearest stations by alarm", () => {
  assert.equal(buildRunningCard(null), null);
  const card = buildRunningCard({ lat: 14.591623, lng: 121.003091 });
  assert.equal(card.length, 10);
  assert.equal(card[0].alarmLevel, "1st Alarm");
  assert.equal(card[9].alarmLevel, "General Alarm");
  const all = card.flatMap((a) => a.stations);
  assert.ok(card.every((a) => a.stations.length === 4));
  assert.ok(all.every((s, i) => i === 0 || all[i - 1].distance <= s.distance));
});
