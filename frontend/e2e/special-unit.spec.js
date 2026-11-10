import { expect, test } from "@playwright/test";
import { SUPER_ADMIN, choose, signInAsSuperAdmin, typeCoordinates } from "./helpers.js";

const MONUMENTO = { lat: 14.6573, lng: 120.9839 }; // Caloocan

test("special unit: an ambulance is not on the running card, the fire city requests it on the incident", async ({ page }) => {
  await signInAsSuperAdmin(page);

  // Give the nearest station an ambulance through the API (the station form is covered elsewhere).
  const login = await page.request.post("/api/auth/login", { data: { accountNumber: SUPER_ADMIN.accountNumber, password: SUPER_ADMIN.password } });
  const headers = { Authorization: `Bearer ${(await login.json()).accessToken}` };
  const card = await (await page.request.get(`/api/running-card?lat=${MONUMENTO.lat}&lng=${MONUMENTO.lng}`, { headers })).json();
  const station = card.alarms[0].stations[0];
  const added = await page.request.post(`/api/stations/${station.id}/trucks`, { headers, data: { callSign: "E2E Amb", type: "AMBULANCE", ownership: "BFP" } });
  expect(added.status()).toBe(201);

  await typeCoordinates(page, `${MONUMENTO.lat}, ${MONUMENTO.lng}`);
  const dispatch = page.getByRole("button", { name: /^Dispatch / });
  await expect(dispatch).toBeEnabled();
  await expect(page.getByText("E2E Amb")).toHaveCount(0); // not on the running card
  await dispatch.click();
  await page.getByRole("dialog").getByRole("button", { name: "Dispatch now" }).click();
  await expect(page).toHaveURL(/\/incidents\/[0-9a-f-]{36}$/);

  await choose(page, page.getByLabel("Special unit type"), "Ambulance");
  const offer = page.getByRole("listitem").filter({ hasText: "E2E Amb" });
  await offer.getByRole("button", { name: "Send" }).click();

  await expect(page.getByRole("listitem").filter({ hasText: /Special unit requested.*1 truck sent/ })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "E2E Amb" })).toContainText("Requested");

  await page.getByRole("button", { name: "Close incident" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Close incident" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: /Incident closed.*released/ })).toBeVisible();
});
