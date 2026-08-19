import { describe, expect, it } from "vitest";

import {
  action as createItemAction,
  loader as listItemsLoader,
} from "~/routes/api.items";
import {
  action as itemByIdAction,
  loader as itemByIdLoader,
} from "~/routes/api.items.$itemId";

const ITEMS_URL = "http://localhost/api/items";

async function asResponse(
  value: Response | Promise<Response>
): Promise<Response> {
  return Promise.resolve(value);
}

describe("api.items route — contract enforcement", () => {
  it("GET /api/items returns listItemsResponseSchema shape", async () => {
    const response = await asResponse(
      listItemsLoader({
        request: new Request(ITEMS_URL),
        params: {},
        context: {},
      }) as Response
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /api/items is not allowed for visitors", () => {
    const response = createItemAction({
      request: new Request(ITEMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Blocked" }),
      }),
      params: {},
      context: {},
    });
    expect(response.status).toBe(405);
  });
});

describe("api.items.$itemId route — contract enforcement", () => {
  it("GET returns 404 for unknown item", async () => {
    const response = await asResponse(
      itemByIdLoader({
        request: new Request(`${ITEMS_URL}/missing`),
        params: { itemId: "missing" },
        context: {},
      }) as Response
    );
    expect(response.status).toBe(404);
  });

  it("PATCH is not allowed for visitors", () => {
    const response = itemByIdAction({
      request: new Request(`${ITEMS_URL}/1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Nope" }),
      }),
      params: { itemId: "1" },
      context: {},
    });
    expect(response.status).toBe(405);
  });
});
