import { test } from "node:test";
import assert from "node:assert/strict";
import { formErrors } from "./validation.js";

// A stand-in with zod's safeParse result shape (the real schemas live in backend/src/shared and are tested there).
const schema = (issues) => ({ safeParse: () => (issues.length ? { success: false, error: { issues } } : { success: true }) });

test("formErrors keeps the first message per field", () => {
  assert.equal(formErrors(schema([]), {}), null);
  assert.deepEqual(
    formErrors(schema([{ path: ["rank"], message: "Choose a rank" }, { path: ["rank"], message: "second" }, { path: ["alarmLevels", 2], message: "Required" }, { path: [], message: "Whole form" }]), {}),
    { rank: "Choose a rank", alarmLevels: "Required", form: "Whole form" },
  );
});
