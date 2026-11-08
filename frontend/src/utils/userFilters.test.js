import { test } from "node:test";
import assert from "node:assert/strict";
import { NO_FILTERS, filterUsers } from "./userFilters.js";

const user = (accountNumber, office) => ({ accountNumber, firstName: "Juan", lastName: "Cruz", rank: "FO1", ...office });
const users = [
  user("B1001", { officeLevel: "REGIONAL", districtId: null, cityId: null }),
  user("B1002", { officeLevel: "DISTRICT", districtId: 2, cityId: null }),
  user("B1003", { officeLevel: "CITY", districtId: 2, cityId: 7 }),
  user("B1004", { officeLevel: "CITY", districtId: 3, cityId: 9 }),
];
const ids = (f) => filterUsers(users, { ...NO_FILTERS, ...f }).map((u) => u.accountNumber);

test("users filter by office, city and search", () => {
  assert.deepEqual(ids({}), ["B1001", "B1002", "B1003", "B1004"]);
  assert.deepEqual(ids({ office: "REGIONAL" }), ["B1001"]);
  assert.deepEqual(ids({ office: 2 }), ["B1002", "B1003"]); // district office and its city offices
  assert.deepEqual(ids({ office: 2, cityId: 7 }), ["B1003"]);
  assert.deepEqual(ids({ search: " b1004 " }), ["B1004"]);
  assert.deepEqual(ids({ search: "juan b1002" }), []); // the whole text must match (name or account number)
  assert.deepEqual(ids({ search: "fo1 juan cruz" }).length, 4); // full display name
});
