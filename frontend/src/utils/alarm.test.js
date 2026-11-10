import { test } from "node:test";
import assert from "node:assert/strict";
import { alarmTone, formatElapsed } from "./alarm.js";

test("alarmTone escalates red → charcoal → black", () => {
  assert.match(alarmTone(0), /bg-primary/);
  assert.match(alarmTone(4), /bg-primary/);
  assert.match(alarmTone(5), /bg-shell/);
  assert.match(alarmTone(9), /bg-black/);
});

test("formatElapsed", () => {
  assert.equal(formatElapsed(0), "00:00");
  assert.equal(formatElapsed(23 * 60_000 + 41_000), "23:41");
  assert.equal(formatElapsed(3_909_000), "1:05:09");
  assert.equal(formatElapsed(-5), "00:00");
});
