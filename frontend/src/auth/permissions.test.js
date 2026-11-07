import { test } from "node:test";
import assert from "node:assert/strict";
import { districtName, officeName } from "./permissions.js";

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
