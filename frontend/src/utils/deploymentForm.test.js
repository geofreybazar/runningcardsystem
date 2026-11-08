import { test } from "node:test";
import assert from "node:assert/strict";
import { deploymentBody, deploymentToForm, toLocalInput } from "./deploymentForm.js";

test("datetime-local values round-trip through the request body", () => {
  const local = "2026-07-27T06:00";
  const body = deploymentBody({ ...deploymentToForm(null), name: " SONA ", locationLabel: "Batasan", lat: 14.69, lng: 121.09, startsAt: local });
  assert.equal(toLocalInput(body.startsAt), local); // same wall-clock time back in the viewer's zone
  assert.deepEqual({ name: body.name, endsAt: body.endsAt, notes: body.notes }, { name: "SONA", endsAt: null, notes: null });
  assert.equal(deploymentBody(deploymentToForm(null)).startsAt, undefined); // blank start: the schema reports it
  assert.equal(toLocalInput(null), "");
});
