import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { submitMetadataAccessRequest } from "~/services/access-policy.server";
import {
  listAccessApplications,
  rememberIdempotencyKey,
  resolveIdempotencyKey,
} from "~/services/access-request-store.server";
import {
  governanceDeniedError,
  governanceHitlError,
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

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  if (idempotencyKey) {
    const existing = resolveIdempotencyKey(idempotencyKey);
    if (existing?.decision) {
      const body = submitAccessResponseSchema.parse({
        data: {
          requestId: existing.id,
          status: existing.status,
          decision: existing.decision,
          auditLogged: existing.decision.require_audit,
        },
      });
      return json(body, { status: existing.status === "draft" ? 201 : 202 });
    }
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
    if (result.status === 422) {
      return json(governanceHitlError(result.error, result.decision), {
        status: 422,
      });
    }
    if (result.status === 403) {
      return json(governanceDeniedError(result.error, result.decision), {
        status: 403,
      });
    }
    return json(
      { error: result.error, decision: result.decision },
      { status: result.status }
    );
  }

  if (idempotencyKey) {
    rememberIdempotencyKey(idempotencyKey, result.data.requestId);
  }

  const body = submitAccessResponseSchema.parse({ data: result.data });
  return json(body, { status: result.status });
}
