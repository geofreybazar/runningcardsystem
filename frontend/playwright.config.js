import { defineConfig, devices } from "@playwright/test";

// Browser smoke tests: the real API on a fresh _test database (backend/test/browser-server.ts) and the Vite app pointed
// at it. Both run on their own ports, so a running dev setup (3000 / 5173, dev database) is never touched.
const API_PORT = 3100;
const WEB_PORT = 5180;

export default defineConfig({
  testDir: "e2e",
  workers: 1, // one shared database
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "on-first-retry",
    viewport: { width: 1366, height: 900 }, // desktop layout: tables rather than phone cards
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } } }],
  webServer: [
    {
      name: "API",
      command: "npm run e2e:browser-server",
      cwd: "../backend",
      url: `http://localhost:${API_PORT}/api/districts`, // 401 while signed out = up
      env: { E2E_API_PORT: String(API_PORT), E2E_WEB_ORIGIN: `http://localhost:${WEB_PORT}` },
      timeout: 240_000, // wipe + migrate + seed + compile
      reuseExistingServer: false,
      stdout: "ignore",
    },
    {
      name: "Web",
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_URL: `http://localhost:${API_PORT}` },
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
