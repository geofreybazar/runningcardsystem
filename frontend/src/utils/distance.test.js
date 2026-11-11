import { test } from "node:test";
import assert from "node:assert/strict";
import { anyStraightLine, isStraightLine } from "./distance.js";

test("flags only stations the API marked as straight-line", () => {
  assert.equal(isStraightLine({ distance: 2, byRoad: false }), true);
  assert.equal(isStraightLine({ distance: 2, byRoad: true }), false);
  assert.equal(isStraightLine({ distance: 2 }), false); // saved before road distances
  assert.equal(anyStraightLine([{ byRoad: true }, { byRoad: false }]), true);
  assert.equal(anyStraightLine([{ byRoad: true }, {}]), false);
});
