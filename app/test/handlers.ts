/**
 * MSW handlers — 所有 API 都需在此（或合併進來的模組）註冊對應 handler。
 * 見 docs/conventions/data-test-driven.md、specs/api/handler-mapping.md
 */

import {
  type Principal,
  sessionResponseSchema,
} from "@ai-search-portal/contracts";
import { http, HttpResponse } from "msw";

import {
  authenticateRequest,
  authFailureResponse,
  sessionClearCookie,
  sessionCookieValue,
  sessionSetCookie,
} from "~/services/auth.server";
import { API_AUTH_SESSION } from "~/shared/api/paths";
import {
  createItemRequestSchema,
  getItemResponseSchema,
  listItemsResponseSchema,
  mockItemSchema,
  updateItemRequestSchema,
} from "~/shared/contracts";

import { contextHandlers } from "./context-handlers";
import { knowledgeHandlers } from "./knowledge-handlers";
import { metadataHandlers } from "./metadata-handlers";

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
let itemsFixture = itemsFixtureRaw.map((item) => mockItemSchema.parse(item));
let nextItemId = itemsFixture.length + 1;

const ITEMS_BY_ID_PATH = "/api/items/:itemId";
const ERROR_ITEM_NOT_FOUND = "Item not found";

function findItemIndex(itemId: string | readonly string[] | undefined): number {
  const id = typeof itemId === "string" ? itemId : itemId?.[0];
  if (!id) return -1;
  return itemsFixture.findIndex((item) => item.id === id);
}

/** PUT/PATCH 共用更新邏輯：依 body 更新 item，回傳 200 或 404/400。 */
async function handleItemUpdate(params: { itemId?: string }, request: Request) {
  const itemId = params.itemId;
  const item = itemsFixture.find((row) => row.id === itemId);
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
  itemsFixture = itemsFixture.map((current) =>
    current.id === item.id ? updated : current
  );
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
      id: String(nextItemId),
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      createdAt: now,
      updatedAt: now,
    });
    nextItemId += 1;
    itemsFixture = [newItem, ...itemsFixture];
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
    const index = findItemIndex(params.itemId);
    if (index === -1) {
      return HttpResponse.json(
        { error: ERROR_ITEM_NOT_FOUND },
        { status: 404 }
      );
    }
    const [removed] = itemsFixture.splice(index, 1);
    const body = getItemResponseSchema.parse({ data: removed });
    return HttpResponse.json(body);
  }),
];

function sessionBody(user: Principal) {
  return sessionResponseSchema.parse({ data: user });
}

const authHandlers = [
  // Literal path keeps `pnpm run lint:handlers` matched; constant used below.
  http.get("/api/auth/session", ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.ok) return authFailureResponse(auth);
    return HttpResponse.json(sessionBody(auth.user));
  }),
  http.post(API_AUTH_SESSION, ({ request }) => {
    const auth = authenticateRequest(request);
    if (!auth.ok) return authFailureResponse(auth);
    const cookie = sessionCookieValue(auth.user);
    if (!cookie) {
      return authFailureResponse({
        ok: false,
        status: 503,
        error: "Admin API token is not configured",
        code: "AUTH_NOT_CONFIGURED",
      });
    }
    return HttpResponse.json(sessionBody(auth.user), {
      headers: { "Set-Cookie": sessionSetCookie(cookie) },
    });
  }),
  http.delete(API_AUTH_SESSION, () => {
    return new HttpResponse(null, {
      status: 204,
      headers: { "Set-Cookie": sessionClearCookie() },
    });
  }),
];

// ---------- 匯總：註冊所有 API handlers ----------
export const handlers = [
  ...authHandlers,
  ...itemsHandlers,
  ...metadataHandlers,
  ...contextHandlers,
  ...knowledgeHandlers,
];
