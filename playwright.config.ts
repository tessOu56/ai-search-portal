import { defineConfig, devices } from "@playwright/test";

/**
 * E2E baseline (T-2026-015).
 *
 * Philosophy: assert STATE and SIDE EFFECTS (policy decision values, access
 * request status machine transitions, URL contract), not brittle UI copy.
 *
 * The dev server is mock-first and fully offline (in-process policy service +
 * context-pack fixtures), so E2E needs no external services and no secrets.
 */
export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/dictionary-perf.measure.ts"],
  timeout: 60_000,
  // Metadata loaders + Vite cold start contend under parallel workers on Windows.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: "reports/e2e-junit.xml" }]]
    : [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    // Remix/Vite pages can keep the "load" event open under HMR; assert on DOM.
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    // predev builds contracts + agent-core before the vite server boots.
    timeout: 180_000,
  },
});
