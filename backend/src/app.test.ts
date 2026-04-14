import { listItemsResponseSchema } from "@ai-search-portal/contracts";
import { describe, expect, it } from "vitest";

import { app } from "./app.js";

describe("ai-search-api", () => {
  it("GET /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("GET /api/items returns seeded items", async () => {
    const res = await app.request("/api/items");
    expect(res.status).toBe(200);
    const json: unknown = await res.json();
    const body = listItemsResponseSchema.parse(json);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({ id: "1", name: "Mock item alpha" });
  });
});
