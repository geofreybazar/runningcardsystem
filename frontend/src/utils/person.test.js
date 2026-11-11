import { test } from "node:test";
import assert from "node:assert/strict";
import { displayName } from "./person.js";

test("displayName", () => {
  assert.equal(displayName({ rank: "SFO2", firstName: "Juan", middleName: "dimaculangan", lastName: "Dela Cruz" }), "SFO2 Juan D Dela Cruz");
  assert.equal(displayName({ rank: null, firstName: "Super", middleName: null, lastName: "Admin" }), "Super Admin");
  assert.equal(displayName({ firstName: "Maria", lastName: "" }), "Maria");
  assert.equal(displayName(null), "");
});
