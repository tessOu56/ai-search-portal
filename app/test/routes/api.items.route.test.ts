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

  it("POST /api/items rejects invalid payload", async () => {
    const response = await createItemAction({
      request: new Request(ITEMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "missing name" }),
      }),
      params: {},
      context: {},
    });
    expect(response.status).toBe(400);
  });

  it("POST /api/items creates item with contract-shaped response", async () => {
    const response = await createItemAction({
      request: new Request(ITEMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: " Route test item ",
          description: "via loader action",
        }),
      }),
      params: {},
      context: {},
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      data: { id: string; name: string };
    };
    expect(body.data.name).toBe("Route test item");
    expect(body.data.id).toBeTruthy();
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

  it("PATCH rejects empty update body", async () => {
    const response = await itemByIdAction({
      request: new Request(`${ITEMS_URL}/1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      params: { itemId: "1" },
      context: {},
    });
    expect(response.status).toBe(400);
  });
});
