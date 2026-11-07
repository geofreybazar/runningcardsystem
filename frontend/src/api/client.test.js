import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSse } from "./client.js";

test("parseSse splits complete events and keeps the partial rest", () => {
  const { events, rest } = parseSse('event: notification\ndata: {"id":1}\n\nevent: ping\ndata: \n\nevent: notif');
  assert.deepEqual(events, [
    { type: "notification", data: '{"id":1}' },
    { type: "ping", data: "" },
  ]);
  assert.equal(rest, "event: notif");
  assert.deepEqual(parseSse(":comment\n\n").events, []);
});
