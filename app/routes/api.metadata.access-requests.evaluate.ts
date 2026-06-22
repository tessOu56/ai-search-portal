import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { evaluateMetadataAccess } from "~/services/access-policy.server";
import {
  evaluateAccessResponseSchema,
  metadataAccessEvaluateRequestSchema,
} from "~/shared/contracts";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = metadataAccessEvaluateRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const decision = evaluateMetadataAccess(parsed.data);
    const body = evaluateAccessResponseSchema.parse({ data: decision });
    return json(body);
  } catch {
    return json({ error: "Asset not found" }, { status: 404 });
  }
}
