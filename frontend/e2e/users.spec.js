import { expect, test } from "@playwright/test";
import { choose, signInAsSuperAdmin } from "./helpers.js";

test("add a Regional Operations account, then find it with search and the office filter", async ({ page }) => {
  await signInAsSuperAdmin(page);
  await page.getByRole("link", { name: "Users" }).click();
  await page.getByRole("button", { name: "Add user" }).click();

  const form = page.getByRole("dialog");
  await choose(page, form.getByLabel("Rank"), "FO1");
  await form.getByLabel("First name").fill("Eve");
  await form.getByLabel("Last name").fill("Browser");
  await form.getByLabel("Account number").fill("EB90101");
  await choose(page, form.getByLabel("Role"), "Operations");
  await choose(page, form.getByLabel("Office"), "Regional Headquarters");
  await form.getByRole("button", { name: "Save" }).click();

  // A new account shows its temporary password once.
  const temp = page.getByRole("dialog", { name: "Temporary password" });
  await expect(temp).toBeVisible();
  await temp.getByRole("button", { name: "Done" }).click();

  await page.getByLabel("Search users").fill("eb90101");
  await expect(page.getByRole("row").filter({ hasText: "EB90101" })).toBeVisible();
  await expect(page.getByText(/^1 of \d+ users$/)).toBeVisible();

  await page.getByLabel("Search users").fill("");
  await choose(page, page.getByLabel("Office"), "Regional Headquarters");
  await expect(page.getByRole("row").filter({ hasText: "EB90101" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Regional Headquarters" }).first()).toBeVisible();
});
