import { test } from "node:test";
import assert from "node:assert/strict";
import { filenameFrom, parseSse } from "./client.js";

test("parseSse splits complete events and keeps the partial rest", () => {
  const { events, rest } = parseSse('event: notification\ndata: {"id":1}\n\nevent: ping\ndata: \n\nevent: notif');
  assert.deepEqual(events, [
    { type: "notification", data: '{"id":1}' },
    { type: "ping", data: "" },
  ]);
  assert.equal(rest, "event: notif");
  assert.deepEqual(parseSse(":comment\n\n").events, []);
});

test("filenameFrom reads the server's file name", () => {
  assert.equal(filenameFrom('attachment; filename="running-card-incidents_2026-10-10_to_2026-11-08.csv"'), "running-card-incidents_2026-10-10_to_2026-11-08.csv");
  assert.equal(filenameFrom(null, "export.csv"), "export.csv");
});
