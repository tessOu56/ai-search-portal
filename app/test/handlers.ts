/**
 * MSW handlers — 所有 API 都需在此（或合併進來的模組）註冊對應 handler。
 * 見 docs/conventions/data-test-driven.md、specs/api/handler-mapping.md
 */

import { http, HttpResponse } from "msw";

import {
  createItemRequestSchema,
  getItemResponseSchema,
  listItemsResponseSchema,
  mockItemSchema,
  updateItemRequestSchema,
} from "~/shared/contracts";

// ---------- Fixtures：Items API mock data（須通過 mockItemSchema） ----------
const itemsFixtureRaw = [
  {
    id: "1",
    name: "Mock item alpha",
    description: "First seeded mock item",
    createdAt: "2026-02-03T00:00:00.000Z",
    updatedAt: "2026-02-03T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Mock item beta",
    description: "Second seeded mock item",
    createdAt: "2026-02-03T00:05:00.000Z",
    updatedAt: "2026-02-03T00:05:00.000Z",
  },
];
const itemsFixture = itemsFixtureRaw.map((item) => mockItemSchema.parse(item));

const ITEMS_BY_ID_PATH = "/api/items/:itemId";
const ERROR_ITEM_NOT_FOUND = "Item not found";

/** PUT/PATCH 共用更新邏輯：依 body 更新 item，回傳 200 或 404/400。 */
async function handleItemUpdate(params: { itemId?: string }, request: Request) {
  const item = itemsFixture.find((i) => i.id === params.itemId);
  if (!item) {
    return HttpResponse.json({ error: ERROR_ITEM_NOT_FOUND }, { status: 404 });
  }
  const raw = (await request.json()) as unknown;
  const parsed = updateItemRequestSchema.safeParse(raw);
  if (
    !parsed.success ||
    (parsed.data.name === undefined && parsed.data.description === undefined)
  ) {
    return HttpResponse.json(
      { error: "Provide name or description to update" },
      { status: 400 }
    );
  }
  const updated = mockItemSchema.parse({
    ...item,
    name: parsed.data.name ?? item.name,
    description:
      parsed.data.description !== undefined
        ? parsed.data.description
        : item.description,
    updatedAt: new Date().toISOString(),
  });
  const body = getItemResponseSchema.parse({ data: updated });
  return HttpResponse.json(body);
}

// ---------- Items API handlers（response 經契約 schema 驗證） ----------
export const itemsHandlers = [
  http.get("/api/items", () => {
    const body = listItemsResponseSchema.parse({ data: itemsFixture });
    return HttpResponse.json(body);
  }),

  http.get(ITEMS_BY_ID_PATH, ({ params }) => {
    const item = itemsFixture.find((i) => i.id === params.itemId);
    if (!item) {
      return HttpResponse.json(
        { error: ERROR_ITEM_NOT_FOUND },
        { status: 404 }
      );
    }
    const body = getItemResponseSchema.parse({ data: item });
    return HttpResponse.json(body);
  }),

  http.post("/api/items", async ({ request }) => {
    const raw = (await request.json()) as unknown;
    const parsed = createItemRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return HttpResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const newItem = mockItemSchema.parse({
      id: "mock-3",
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      createdAt: now,
      updatedAt: now,
    });
    const body = getItemResponseSchema.parse({ data: newItem });
    return HttpResponse.json(body, { status: 201 });
  }),

  http.put(ITEMS_BY_ID_PATH, async ({ params, request }) =>
    handleItemUpdate(params, request)
  ),

  http.patch(ITEMS_BY_ID_PATH, async ({ params, request }) =>
    handleItemUpdate(params, request)
  ),

  http.delete(ITEMS_BY_ID_PATH, ({ params }) => {
    const item = itemsFixture.find((i) => i.id === params.itemId);
    if (!item) {
      return HttpResponse.json(
        { error: ERROR_ITEM_NOT_FOUND },
        { status: 404 }
      );
    }
    const body = getItemResponseSchema.parse({ data: item });
    return HttpResponse.json(body);
  }),
];

// ---------- 匯總：註冊所有 API handlers ----------
export const handlers = [...itemsHandlers];
