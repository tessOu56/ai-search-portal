import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { submitMetadataAccessRequest } from "~/services/access-policy.server";
import { listAccessApplications } from "~/services/access-request-store.server";
import {
  listAccessApplicationsResponseSchema,
  metadataAccessRequestSchema,
  submitAccessResponseSchema,
} from "~/shared/contracts";

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const requesterId = url.searchParams.get("requesterId") ?? undefined;
  const pendingOnly = url.searchParams.get("pendingOnly") === "1";
  const rows = listAccessApplications({
    requesterId,
    pendingOnly,
  });
  const body = listAccessApplicationsResponseSchema.parse({ data: rows });
  return json(body);
}

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

  const parsed = metadataAccessRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = submitMetadataAccessRequest(parsed.data);
  if (!result.ok) {
    return json(
      { error: result.error, decision: result.decision },
      { status: result.status }
    );
  }

  const body = submitAccessResponseSchema.parse({ data: result.data });
  return json(body, { status: 202 });
}
