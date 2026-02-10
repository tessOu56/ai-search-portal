import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import {
  deleteMockItem,
  getMockItem,
  updateMockItem,
} from "~/services/mock-items.server";

type UpdatePayload = {
  name?: unknown;
  description?: unknown;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

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

  return json({ data: item });
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
    return json({ data: removed });
  }

  if (request.method !== "PUT" && request.method !== "PATCH") {
    return json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "PUT, PATCH, DELETE" } }
    );
  }

  let payload: UpdatePayload;
  try {
    payload = (await request.json()) as UpdatePayload;
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const nextName = isNonEmptyString(payload.name)
    ? payload.name.trim()
    : undefined;
  const nextDescription =
    typeof payload.description === "string" ? payload.description : undefined;

  if (nextName === undefined && nextDescription === undefined) {
    return json(
      { error: "Provide name or description to update" },
      { status: 400 }
    );
  }

  const updated = updateMockItem(itemId, {
    name: nextName,
    description: nextDescription,
  });
  if (!updated) {
    return json({ error: ERROR_ITEM_NOT_FOUND }, { status: 404 });
  }

  return json({ data: updated });
}
