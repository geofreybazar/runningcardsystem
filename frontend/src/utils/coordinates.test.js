import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCoordinates } from "./coordinates.js";

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
