import { expect, test } from "@playwright/test";
import { choose, signInAsSuperAdmin } from "./helpers.js";

test("stations: region-wide resource counts, then narrow to one city of Fire District II", async ({ page }) => {
  await signInAsSuperAdmin(page);
  await page.getByRole("link", { name: "Stations & Trucks" }).click();

  // The Regional office opens on all districts: one row per district plus the NCR total.
  const resources = page.getByRole("table", { name: /^Resources/ });
  await expect(resources.getByRole("row").filter({ hasText: "NCR total" })).toBeVisible();
  const search = page.getByPlaceholder(/^Search \d+ stations$/);
  const countOf = async () => Number((await search.getAttribute("placeholder")).match(/\d+/)[0]);
  const all = await countOf();

  // Fire District II covers several cities, so a City filter appears.
  await choose(page, page.getByLabel("Fire district"), "Fire District II (CAMANAVA)");
  await expect(page.getByLabel("City", { exact: true })).toBeVisible();
  await expect(resources.getByRole("row").filter({ hasText: " total" })).toBeVisible();
  const district = await countOf();
  expect(district).toBeLessThan(all);

  // Wide screens: the page fits the window; the station list scrolls inside its panel instead of the page.
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(overflow).toBeLessThanOrEqual(1);

  await choose(page, page.getByLabel("City", { exact: true }), "Caloocan");
  await expect.poll(countOf).toBeLessThan(district);
  // One city: just its row, no total.
  await expect(resources.getByRole("row").filter({ hasText: "Caloocan" })).toHaveCount(1);
  await expect(resources.getByRole("row").filter({ hasText: " total" })).toHaveCount(0);
});
