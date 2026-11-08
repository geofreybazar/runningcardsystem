import { test } from "node:test";
import assert from "node:assert/strict";
import { notificationLink, notificationPlace, trucksMoved } from "./notification.js";

const incident = { incidentId: "i1", type: "DISPATCHED", units: [{}, {}], incident: { locationLabel: "Tondo", city: { name: "Manila" } } };
const deployment = { deploymentId: "d1", type: "DEPLOYMENT_RELEASED", units: [{}], deployment: { name: "SONA 2026", locationLabel: "Batasan" } };

test("notifications point at their incident or deployment", () => {
  assert.equal(notificationLink(incident), "/incidents/i1");
  assert.equal(notificationLink(deployment), "/deployments/d1");
  assert.equal(notificationPlace(incident), "Tondo, Manila");
  assert.equal(notificationPlace(deployment), "Batasan (SONA 2026)");
  assert.equal(trucksMoved(incident), "2 of your trucks sent");
  assert.equal(trucksMoved(deployment), "1 of your truck released");
  assert.equal(trucksMoved({ ...deployment, type: "DEPLOYMENT_ASSIGNED" }), "1 of your truck deployed");
  assert.equal(trucksMoved({ ...incident, units: [] }), undefined);
});
