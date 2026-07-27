import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import {
  deleteMockItem,
  getMockItem,
  updateMockItem,
} from "~/services/mock-items.server";
import {
  getItemResponseSchema,
  updateItemRequestSchema,
} from "~/shared/contracts";

const ERROR_ITEM_NOT_FOUND = "Item not found";

export function loader({ params }: LoaderFunctionArgs) {
  const itemId = params.itemId;
  if (!itemId) {
    return json({ error: "Missing item id" }, { status: 400 });
  }

  const item = getMockItem(itemId);
  if (!item) {
    return json({ error: ERROR_ITEM_NOT_FOUND }, { status: 404 });
  }

  return json(getItemResponseSchema.parse({ data: item }));
}

export async function action({ params, request }: ActionFunctionArgs) {
  const itemId = params.itemId;
  if (!itemId) {
    return json({ error: "Missing item id" }, { status: 400 });
  }

  if (request.method === "DELETE") {
    const removed = deleteMockItem(itemId);
    if (!removed) {
      return json({ error: ERROR_ITEM_NOT_FOUND }, { status: 404 });
    }
    return json(getItemResponseSchema.parse({ data: removed }));
  }

  if (request.method !== "PUT" && request.method !== "PATCH") {
    return json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "PUT, PATCH, DELETE" } }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = updateItemRequestSchema.safeParse(raw);
  if (
    !parsed.success ||
    (parsed.data.name === undefined && parsed.data.description === undefined)
  ) {
    return json(
      { error: "Provide name or description to update" },
      { status: 400 }
    );
  }

  const updated = updateMockItem(itemId, {
    name: parsed.data.name,
    description: parsed.data.description,
  });
  if (!updated) {
    return json({ error: ERROR_ITEM_NOT_FOUND }, { status: 404 });
  }

  return json(getItemResponseSchema.parse({ data: updated }));
}
