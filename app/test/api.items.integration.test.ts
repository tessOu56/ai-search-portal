/**
 * Items API 整合測試 — 透過 MSW mock 打 /api/items，驗證 response 符合契約。
 * 全部使用 mock，不連真實後端。見 docs/conventions/data-test-driven.md
 * 依賴 setup.ts 的 server.listen() 與 jsdom url: http://localhost，使相對路徑打中 MSW。
 */

import { describe, expect, it } from "vitest";

import { API_ITEMS, apiItem } from "~/shared/api/paths";
import {
  getItemResponseSchema,
  listItemsResponseSchema,
} from "~/shared/contracts";

describe("GET /api/items (list) — MSW mock", () => {
  it("returns list shaped by listItemsResponseSchema", async () => {
    const res = await fetch(API_ITEMS);
    expect(res.ok).toBe(true);
    const json = (await res.json()) as unknown;
    const parsed = listItemsResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(Array.isArray(parsed.data.data)).toBe(true);
      expect(parsed.data.data.length).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("GET /api/items/:itemId — MSW mock", () => {
  it("returns single item shaped by getItemResponseSchema when id exists", async () => {
    const res = await fetch(apiItem("1"));
    expect(res.ok).toBe(true);
    const json = (await res.json()) as unknown;
    const parsed = getItemResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.data).toHaveProperty("id");
      expect(parsed.data.data).toHaveProperty("name");
      expect(parsed.data.data).toHaveProperty("createdAt");
    }
  });

  it("returns 404 for unknown id", async () => {
    const res = await fetch(apiItem("nonexistent"));
    expect(res.status).toBe(404);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBeDefined();
  });
});

describe("POST /api/items — MSW mock persistence", () => {
  it("creates an item and returns contract-shaped response", async () => {
    const res = await fetch(API_ITEMS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Integration test item",
        description: "Created via MSW",
      }),
    });
    expect(res.status).toBe(201);
    const json = (await res.json()) as unknown;
    const parsed = getItemResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.data.name).toBe("Integration test item");
      expect(parsed.data.data.id).toMatch(/^\d+$/);
    }
  });

  it("returns 400 when name is missing", async () => {
    const res = await fetch(API_ITEMS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "no name" }),
    });
    expect(res.status).toBe(400);
  });
});
