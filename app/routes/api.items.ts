import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { listMockItems } from "~/services/mock-items.server";
import { listItemsResponseSchema } from "~/shared/contracts";

export function loader(_args: LoaderFunctionArgs) {
  return Response.json(
    listItemsResponseSchema.parse({ data: listMockItems() })
  );
}

export function action(_args: ActionFunctionArgs) {
  return Response.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } }
  );
}
