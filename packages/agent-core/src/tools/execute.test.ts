import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { executeItemsLookup, isItemsLookupEnabled } from "./execute.js";

describe("executeItemsLookup", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    const iso = "2026-01-01T00:00:00.000Z";
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  id: "1",
                  name: "Mock item alpha",
                  description: "authentication guide",
                  createdAt: iso,
                  updatedAt: iso,
                },
                {
                  id: "2",
                  name: "Mock item beta",
                  description: "other",
                  createdAt: iso,
                  updatedAt: iso,
                },
              ],
            }),
        } as Response)
      )
    );
    process.env.ITEMS_API_URL = "http://127.0.0.1:3001/api/v1/items";
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.unstubAllGlobals();
  });

  it("isItemsLookupEnabled when ITEMS_API_URL is set", () => {
    expect(isItemsLookupEnabled()).toBe(true);
  });

  it("filters items by query tokens", async () => {
    const result = await executeItemsLookup("authentication OAuth");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]?.id).toBe("1");
      expect(result.total).toBe(2);
    }
  });

  it("returns error on HTTP failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    } as Response);
    const result = await executeItemsLookup("test");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("ITEMS_HTTP_ERROR");
    }
  });
});
