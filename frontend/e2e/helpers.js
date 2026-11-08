import { expect } from "@playwright/test";

/** The seeded super admin (backend/test/global-setup.ts); the first spec to sign in replaces the temporary password. */
export const SUPER_ADMIN = { accountNumber: "superadmin", initial: "Initial-pass-1", password: "E2e-browser-pass-1" };

/** Signs in as the super admin, changing the temporary password on the very first sign-in. Ends on the running card. */
export async function signInAsSuperAdmin(page) {
  await page.goto("/");
  await page.getByLabel("Account number").fill(SUPER_ADMIN.accountNumber);
  await page.getByLabel("Password", { exact: true }).fill(SUPER_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  const changed = page.getByRole("link", { name: "Running Card" });
  const failed = page.getByRole("alert").filter({ hasText: /invalid|incorrect|wrong/i });
  await expect(changed.or(failed)).toBeVisible();
  if (await changed.isVisible()) return;

  // Still the temporary password: sign in with it and choose ours.
  await page.getByLabel("Password", { exact: true }).fill(SUPER_ADMIN.initial);
  await page.getByRole("button", { name: "Sign in" }).click();
  await changePassword(page, SUPER_ADMIN.initial, SUPER_ADMIN.password);
  await expect(changed).toBeVisible();
}

export async function changePassword(page, current, next) {
  await expect(page.getByRole("heading", { name: "Change your password" })).toBeVisible();
  await page.getByLabel("Current password").fill(current);
  await page.getByLabel("New password", { exact: true }).fill(next);
  await page.getByLabel("Confirm new password").fill(next);
  await page.getByRole("button", { name: "Save password" }).click();
}

/** Picks a place by typed coordinates (no Google call), in the given container (page or a dialog). */
export async function typeCoordinates(scope, coords) {
  const search = scope.getByLabel("Search for an address, landmark, or coordinates");
  await search.fill(coords);
  await search.press("Enter");
}

/** Chooses an option in one of our selects (shadcn/Radix: a combobox button, then an option in a popup). */
export async function choose(page, select, option) {
  await select.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
