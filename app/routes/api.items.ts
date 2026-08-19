import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { listMockItems } from "~/services/mock-items.server";
import { listItemsResponseSchema } from "~/shared/contracts";

export function loader(_args: LoaderFunctionArgs) {
  return json(listItemsResponseSchema.parse({ data: listMockItems() }));
}

export function action(_args: ActionFunctionArgs) {
  return json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } }
  );
}
