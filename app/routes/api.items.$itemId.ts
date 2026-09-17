import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { getMockItem } from "~/services/mock-items.server";
import { getItemResponseSchema } from "~/shared/contracts";

const ERROR_ITEM_NOT_FOUND = "Item not found";

export function loader({ params }: LoaderFunctionArgs) {
  const itemId = params.itemId;
  if (!itemId) {
    return Response.json({ error: "Missing item id" }, { status: 400 });
  }

  const item = getMockItem(itemId);
  if (!item) {
    return Response.json({ error: ERROR_ITEM_NOT_FOUND }, { status: 404 });
  }

  return Response.json(getItemResponseSchema.parse({ data: item }));
}

export function action(_args: ActionFunctionArgs) {
  return Response.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } }
  );
}
