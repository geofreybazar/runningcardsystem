import { expect, test } from "@playwright/test";
import { SUPER_ADMIN, signInAsSuperAdmin } from "./helpers.js";

test("first sign-in forces a new password; sign out returns to the login page", async ({ page }) => {
  await signInAsSuperAdmin(page); // on a fresh database this goes through the forced password change
  await expect(page.getByRole("heading", { name: "Running Card" }).or(page.getByLabel("Search for an address, landmark, or coordinates")).first()).toBeVisible();

  await page.getByRole("button", { name: new RegExp(`^Account: .*${SUPER_ADMIN.accountNumber}`, "i") }).click(); // top bar account menu
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

  // The old temporary password no longer works.
  await page.getByLabel("Account number").fill(SUPER_ADMIN.accountNumber);
  await page.getByLabel("Password", { exact: true }).fill(SUPER_ADMIN.initial);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});
