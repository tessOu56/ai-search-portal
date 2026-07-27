import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { createMockItem, listMockItems } from "~/services/mock-items.server";
import {
  createItemRequestSchema,
  getItemResponseSchema,
  listItemsResponseSchema,
} from "~/shared/contracts";

export function loader(_args: LoaderFunctionArgs) {
  return json(listItemsResponseSchema.parse({ data: listMockItems() }));
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "POST" } }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = createItemRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Name is required" }, { status: 400 });
  }

  const item = createMockItem({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  });

  return json(getItemResponseSchema.parse({ data: item }), { status: 201 });
}
