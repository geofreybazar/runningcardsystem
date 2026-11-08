import { test } from "node:test";
import assert from "node:assert/strict";
import { auditDetails } from "./audit.js";

test("auditDetails reads like a sentence", () => {
  assert.equal(auditDetails({ action: "SIGN_IN_FAILED", changes: { reason: "wrong password", accountNumber: "B13084" }, ip: "203.0.113.5" }), "wrong password, account number B13084 from 203.0.113.5");
  assert.equal(
    auditDetails({ action: "DISPATCH", changes: { alarmLevel: "1st Alarm", locationLabel: "Tondo", city: "Manila", trucks: ["E-1 (Station A)", "E-2 (Station B)"] } }),
    "1st Alarm for Tondo (Manila): E-1 (Station A), E-2 (Station B)",
  );
  assert.equal(auditDetails({ action: "SET_PIN", entity: "Barangay", changes: { name: "Brgy. 1", to: { lat: 14.6, lng: 120.98 } } }), "Brgy. 1: 14.60000, 120.98000");
  assert.equal(auditDetails({ action: "UPDATE", entity: "Truck", changes: { status: "AVAILABLE" } }), '{"status":"AVAILABLE"}');
});
