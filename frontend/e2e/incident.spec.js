import { expect, test } from "@playwright/test";
import { signInAsSuperAdmin, typeCoordinates } from "./helpers.js";

test("running card → dispatch → incident page → close", async ({ page }) => {
  await signInAsSuperAdmin(page);
  await typeCoordinates(page, "14.6573, 120.9839"); // Monumento, Caloocan

  const dispatch = page.getByRole("button", { name: /^Dispatch / });
  await expect(dispatch).toBeEnabled();
  await dispatch.click();
  await page.getByRole("dialog").getByRole("button", { name: "Dispatch now" }).click();

  await expect(page).toHaveURL(/\/incidents\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Time log" })).toBeVisible();
  // The time log (a toast says the same thing, so look for the log entry with its truck count).
  await expect(page.getByRole("listitem").filter({ hasText: /1st Alarm dispatched.*trucks? sent/ })).toBeVisible();

  await page.getByRole("button", { name: "Close incident" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Close incident" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: /Incident closed.*released/ })).toBeVisible();

  await page.getByRole("link", { name: "All incidents" }).click();
  await page.getByRole("tab", { name: "Closed" }).click();
  await expect(page.getByRole("row").filter({ hasText: "14.6573, 120.9839" }).first()).toBeVisible();
});
