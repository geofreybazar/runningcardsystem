import { expect, test } from "@playwright/test";
import { signInAsSuperAdmin } from "./helpers.js";

test("about page: readable before signing in, and from the sidebar with the live alarm levels", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "About this system" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByText("SFO1 Geofrey R Bazar").first()).toBeVisible();
  await expect(page.getByRole("list", { name: "Alarm levels" })).toHaveCount(0); // settings need a sign-in
  await page.getByRole("link", { name: "Back to sign in" }).click();

  await signInAsSuperAdmin(page);
  await page.getByRole("link", { name: "About" }).click();
  await expect(page.getByRole("heading", { name: "About", exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Alarm levels" }).getByText("1st Alarm")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: /^Ambulance$/ })).toBeVisible(); // special units list
});
