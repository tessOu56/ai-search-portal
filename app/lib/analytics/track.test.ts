import { afterEach, describe, expect, it, vi } from "vitest";

import { trackSearchSubmitted } from "./track";

describe("analytics track wrappers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not POST when disabled", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    trackSearchSubmitted({ surface: "chat", queryLength: 4 });
    await import("./product-events");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs after the analytics chunk loads", async () => {
    vi.stubEnv("VITE_ANALYTICS_ENABLED", "1");
    vi.stubEnv("VITE_ANALYTICS_ENDPOINT", "http://localhost:19000");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    trackSearchSubmitted({ surface: "catalog_search", queryLength: 6 });

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { name: string };
    expect(body.name).toBe("search_submitted");
  });
});
