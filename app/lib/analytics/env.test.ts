import { afterEach, describe, expect, it, vi } from "vitest";

import { isProductAnalyticsEnabled, productAnalyticsEndpoint } from "./env";

describe("analytics env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is disabled when VITE_ANALYTICS_ENABLED is absent", () => {
    expect(isProductAnalyticsEnabled()).toBe(false);
    expect(productAnalyticsEndpoint()).toBeNull();
  });

  it("returns the default endpoint when enabled", () => {
    vi.stubEnv("VITE_ANALYTICS_ENABLED", "1");
    expect(isProductAnalyticsEnabled()).toBe(true);
    expect(productAnalyticsEndpoint()).toBe("http://localhost:19000");
  });
});
