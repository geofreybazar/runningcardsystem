import { test } from "node:test";
import assert from "node:assert/strict";
import { canEditCity, canManageDeployments, districtName, officeName } from "./permissions.js";

test("officeName uses BFP office names", () => {
  assert.equal(officeName({ officeLevel: "CITY", city: { name: "Caloocan" }, district: { code: 2 } }), "Caloocan City Fire Station");
  assert.equal(officeName({ officeLevel: "CITY", city: { name: "Pateros" }, district: { code: 4 } }), "Pateros Municipal Fire Station");
  assert.equal(officeName({ officeLevel: "CITY", city: { name: "Manila" }, district: { code: 1 } }), "Manila Fire District");
  assert.equal(officeName({ officeLevel: "DISTRICT", district: { code: 3 } }), "Fire District III");
  assert.equal(officeName({ officeLevel: "DISTRICT", district: { code: 5 } }), "Quezon City Fire District");
  assert.equal(officeName({ officeLevel: "REGIONAL" }), "Regional Headquarters");
  assert.equal(districtName({ code: 2, alias: "CAMANAVA" }), "Fire District II (CAMANAVA)");
  assert.equal(districtName({ code: 1, alias: "Manila Fire District" }), "Manila Fire District");
});

test("canEditCity: only the office running the city", () => {
  const ops = (officeCityId) => ({ role: "OPERATIONS", officeCityId });
  assert.equal(canEditCity(ops(3), 3), true); // city office, or FD1/FD5 for their city
  assert.equal(canEditCity(ops(3), 4), false);
  assert.equal(canEditCity(ops(null), 3), false); // Fire District II-IV: view only
  assert.equal(canEditCity({ role: "SUPER_ADMIN" }, 3), true);
  assert.equal(canEditCity({ role: "RADIO_OPERATOR", officeCityId: 3 }, 3), false);
});

test("only Regional Operations and Super Admin manage special deployments", () => {
  assert.equal(canManageDeployments({ role: "OPERATIONS", officeLevel: "REGIONAL" }), true);
  assert.equal(canManageDeployments({ role: "SUPER_ADMIN", officeLevel: "REGIONAL" }), true);
  assert.equal(canManageDeployments({ role: "OPERATIONS", officeLevel: "CITY" }), false);
  assert.equal(canManageDeployments({ role: "RADIO_OPERATOR", officeLevel: "REGIONAL" }), false);
});
