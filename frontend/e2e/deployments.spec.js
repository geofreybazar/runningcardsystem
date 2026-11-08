import { expect, test } from "@playwright/test";
import { signInAsSuperAdmin, typeCoordinates } from "./helpers.js";

test("special deployment: create, add a truck, set its post, see it Deployed on Stations, end, delete", async ({ page }) => {
  await signInAsSuperAdmin(page);
  await page.getByRole("link", { name: "Special Deployments" }).click();
  await page.getByRole("button", { name: "New deployment" }).click();

  const form = page.getByRole("dialog");
  await form.getByLabel("Event").fill("E2E Summit");
  await form.getByLabel("Location").fill("Batasang Pambansa");
  await form.getByLabel("Starts").fill("2026-12-01T08:00");
  await typeCoordinates(form, "14.6923, 121.0965");
  await form.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "E2E Summit" })).toBeVisible();

  // Add the first available truck of the first district.
  await page.getByRole("button", { name: "Add trucks" }).click();
  const picker = page.getByRole("dialog");
  const station = picker.getByRole("listitem").first();
  const stationName = (await station.locator("div").first().innerText()).trim();
  const truck = station.locator("label").first();
  const callSign = (await truck.locator("span").first().innerText()).trim();
  await truck.getByRole("checkbox").check();
  await picker.getByRole("button", { name: "Deploy 1 truck" }).click();

  const row = page.getByRole("row").filter({ hasText: callSign });
  await expect(row).toContainText("Event location");

  // Give it its own post.
  await row.getByRole("button", { name: "Set post" }).click();
  const post = page.getByRole("dialog");
  await post.getByLabel("Post").fill("Quiapo Church");
  await typeCoordinates(post, "14.5986, 120.9837");
  await post.getByRole("button", { name: "Save post" }).click();
  await expect(row).toContainText("Quiapo Church");

  // Its station shows it as Deployed, linked to the event, with no status menu.
  await page.getByRole("link", { name: "Stations & Trucks" }).click();
  await page.getByPlaceholder(/^Search \d+ stations$/).fill(stationName);
  await page.getByRole("button", { name: new RegExp(stationName) }).first().click();
  const truckRow = page.getByRole("row").filter({ hasText: callSign });
  await expect(truckRow).toContainText("Deployed");
  await truckRow.getByRole("link", { name: "E2E Summit" }).click();

  // End: the truck goes back to Available.
  await page.getByRole("button", { name: "End deployment" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "End deployment" }).click();
  await expect(page.getByText("Ended", { exact: true })).toBeVisible();

  // Delete: gone from the list.
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/deployments$/);
  await page.getByRole("tab", { name: "Ended" }).click();
  await expect(page.getByRole("cell", { name: "E2E Summit", exact: true })).toHaveCount(0); // a toast still names it

  await page.getByRole("link", { name: "Stations & Trucks" }).click();
  await page.getByPlaceholder(/^Search \d+ stations$/).fill(stationName);
  await page.getByRole("button", { name: new RegExp(stationName) }).first().click();
  await expect(page.getByRole("row").filter({ hasText: callSign })).not.toContainText("Deployed");
});
