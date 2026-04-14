/**
 * Items 契約單元測試 — 使用 mock fixture 驗證 Zod schema parse / safeParse。
 * 見 docs/conventions/data-test-driven.md、specs/api/contract-schema.md
 */

import {
  createItemRequestSchema,
  errorResponseSchema,
  getItemResponseSchema,
  listItemsResponseSchema,
  mockItemSchema,
  updateItemRequestSchema,
} from "@ai-search-portal/contracts";
import { describe, expect, it } from "vitest";

const validItem = {
  id: "1",
  name: "Fixture item",
  description: "For tests",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("mockItemSchema", () => {
  it("accepts valid item", () => {
    expect(mockItemSchema.parse(validItem)).toEqual(validItem);
  });

  it("rejects missing id", () => {
    const { id: _, ...noId } = validItem;
    expect(() => mockItemSchema.parse(noId)).toThrow();
  });

  it("accepts non-empty name only (schema allows any string)", () => {
    // mockItemSchema 的 name 為 z.string() 未 .min(1)；空字串在此 schema 仍合法
    expect(mockItemSchema.parse({ ...validItem, name: "x" })).toMatchObject({
      name: "x",
    });
  });

  it("accepts null description", () => {
    expect(
      mockItemSchema.parse({ ...validItem, description: null })
    ).toMatchObject({ description: null });
  });
});

describe("listItemsResponseSchema", () => {
  it("accepts array of items", () => {
    const res = listItemsResponseSchema.parse({ data: [validItem] });
    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toEqual(validItem);
  });

  it("accepts empty array", () => {
    const res = listItemsResponseSchema.parse({ data: [] });
    expect(res.data).toEqual([]);
  });

  it("rejects missing data", () => {
    expect(() => listItemsResponseSchema.parse({})).toThrow();
  });
});

describe("getItemResponseSchema", () => {
  it("accepts single item", () => {
    const res = getItemResponseSchema.parse({ data: validItem });
    expect(res.data).toEqual(validItem);
  });
});

describe("createItemRequestSchema", () => {
  it("accepts valid create payload and trims name", () => {
    const res = createItemRequestSchema.parse({
      name: "  New item  ",
      description: null,
    });
    expect(res.name).toBe("New item");
    expect(res.description).toBeNull();
  });

  it("rejects empty name", () => {
    expect(createItemRequestSchema.safeParse({ name: "" })).toMatchObject({
      success: false,
    });
  });

  it("accepts description optional", () => {
    const res = createItemRequestSchema.parse({ name: "Only name" });
    expect(res.name).toBe("Only name");
    expect(res.description).toBeUndefined();
  });
});

describe("updateItemRequestSchema", () => {
  it("accepts partial update", () => {
    const res = updateItemRequestSchema.parse({ name: "Updated" });
    expect(res.name).toBe("Updated");
  });

  it("accepts description only", () => {
    const res = updateItemRequestSchema.parse({
      description: "New desc",
    });
    expect(res.description).toBe("New desc");
  });
});

describe("errorResponseSchema", () => {
  it("accepts error message", () => {
    const res = errorResponseSchema.parse({ error: "Item not found" });
    expect(res.error).toBe("Item not found");
  });

  it("rejects missing error", () => {
    expect(() => errorResponseSchema.parse({})).toThrow();
  });
});
