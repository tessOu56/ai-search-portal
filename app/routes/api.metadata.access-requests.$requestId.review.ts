import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { reviewAccessApplication } from "~/services/access-request-store.server";
import {
  reviewAccessRequestSchema,
  reviewAccessResponseSchema,
} from "~/shared/contracts";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const requestId = params.requestId;
  if (!requestId) {
    return json({ error: "Missing requestId" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = reviewAccessRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const updated = reviewAccessApplication({
    id: requestId,
    decision: parsed.data.decision,
  });
  if (!updated) {
    return json({ error: "Access request not found" }, { status: 404 });
  }

  const body = reviewAccessResponseSchema.parse({ data: updated });
  return json(body);
}
