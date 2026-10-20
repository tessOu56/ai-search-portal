import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isProductAnalyticsEnabled,
  trackProductEvent,
  trackSearchSubmitted,
} from "./product-events";

describe("product-events", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is disabled when VITE_ANALYTICS_ENABLED is absent", () => {
    expect(isProductAnalyticsEnabled()).toBe(false);
  });

  it("does not POST when disabled, even for a valid event", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    trackSearchSubmitted({ surface: "chat", queryLength: 12 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs a closed search_submitted payload when enabled", () => {
    vi.stubEnv("VITE_ANALYTICS_ENABLED", "1");
    vi.stubEnv("VITE_ANALYTICS_ENDPOINT", "http://localhost:19000");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    trackSearchSubmitted({ surface: "catalog_search", queryLength: 8 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      name: string;
      properties: { queryLength: number };
    };
    expect(body.name).toBe("search_submitted");
    expect(body.properties).toEqual({ queryLength: 8 });
    expect(body).not.toHaveProperty("query");
  });

  it("drops events that fail the closed schema", () => {
    vi.stubEnv("VITE_ANALYTICS_ENABLED", "1");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    trackProductEvent({
      name: "search_submitted",
      eventId: "e1",
      at: "not-a-date",
      surface: "chat",
      properties: { queryLength: 1 },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
