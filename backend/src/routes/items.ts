import {
  createItemRequestSchema,
  getItemResponseSchema,
  listItemsResponseSchema,
  updateItemRequestSchema,
} from "@ai-search-portal/contracts";
import { type Context, Hono } from "hono";

import {
  createMockItem,
  deleteMockItem,
  getMockItem,
  listMockItems,
  updateMockItem,
} from "../store/items.js";

const ERROR_ITEM_NOT_FOUND = "Item not found";
const ERROR_MISSING_ITEM_ID = "Missing item id";

export const itemsApi = new Hono();

itemsApi.get("/", (c) => {
  const body = listItemsResponseSchema.parse({ data: listMockItems() });
  return c.json(body);
});

itemsApi.post("/", async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }
  const parsed = createItemRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "Name is required" }, 400);
  }
  const item = createMockItem({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  });
  const body = getItemResponseSchema.parse({ data: item });
  return c.json(body, 201);
});

itemsApi.get("/:itemId", (c) => {
  const itemId = c.req.param("itemId");
  if (!itemId) {
    return c.json({ error: ERROR_MISSING_ITEM_ID }, 400);
  }
  const item = getMockItem(itemId);
  if (!item) {
    return c.json({ error: ERROR_ITEM_NOT_FOUND }, 404);
  }
  const body = getItemResponseSchema.parse({ data: item });
  return c.json(body);
});

itemsApi.delete("/:itemId", (c) => {
  const itemId = c.req.param("itemId");
  if (!itemId) {
    return c.json({ error: ERROR_MISSING_ITEM_ID }, 400);
  }
  const removed = deleteMockItem(itemId);
  if (!removed) {
    return c.json({ error: ERROR_ITEM_NOT_FOUND }, 404);
  }
  const body = getItemResponseSchema.parse({ data: removed });
  return c.json(body);
});

const handleItemUpdate = async (c: Context) => {
  const itemId = c.req.param("itemId");
  if (!itemId) {
    return c.json({ error: ERROR_MISSING_ITEM_ID }, 400);
  }
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }
  const parsed = updateItemRequestSchema.safeParse(raw);
  if (
    !parsed.success ||
    (parsed.data.name === undefined && parsed.data.description === undefined)
  ) {
    return c.json({ error: "Provide name or description to update" }, 400);
  }
  const updated = updateMockItem(itemId, {
    name: parsed.data.name,
    description: parsed.data.description,
  });
  if (!updated) {
    return c.json({ error: ERROR_ITEM_NOT_FOUND }, 404);
  }
  const body = getItemResponseSchema.parse({ data: updated });
  return c.json(body);
};

itemsApi.put("/:itemId", handleItemUpdate);
itemsApi.patch("/:itemId", handleItemUpdate);
