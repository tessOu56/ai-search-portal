import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/dictionary-perf.measure.ts",
  timeout: 180_000,
  workers: 1,
  use: { baseURL: "http://localhost:5173", navigationTimeout: 120_000 },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
