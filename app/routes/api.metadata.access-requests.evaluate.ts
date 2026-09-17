import type { ActionFunctionArgs } from "react-router";

import { evaluateMetadataAccess } from "~/services/access-policy.server";
import {
  evaluateAccessResponseSchema,
  metadataAccessEvaluateRequestSchema,
} from "~/shared/contracts";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = metadataAccessEvaluateRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const decision = evaluateMetadataAccess(parsed.data);
    const body = evaluateAccessResponseSchema.parse({ data: decision });
    return Response.json(body);
  } catch {
    return Response.json({ error: "Asset not found" }, { status: 404 });
  }
}
