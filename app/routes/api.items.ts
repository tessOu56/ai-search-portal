import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { createMockItem, listMockItems } from "~/services/mock-items.server";

type CreatePayload = {
  name?: unknown;
  description?: unknown;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function loader(_args: LoaderFunctionArgs) {
  return json({ data: listMockItems() });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "POST" } }
    );
  }

  let payload: CreatePayload;
  try {
    payload = (await request.json()) as CreatePayload;
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!isNonEmptyString(payload.name)) {
    return json({ error: "Name is required" }, { status: 400 });
  }

  const description =
    typeof payload.description === "string" ? payload.description : null;
  const item = createMockItem({
    name: payload.name.trim(),
    description,
  });

  return json({ data: item }, { status: 201 });
}
