import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

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
  return Response.json(body);
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
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
      return Response.json(body, {
        status: existing.status === "draft" ? 201 : 202,
      });
    }
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = metadataAccessRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = submitMetadataAccessRequest(parsed.data);
  if (!result.ok) {
    if (result.status === 422) {
      return Response.json(governanceHitlError(result.error, result.decision), {
        status: 422,
      });
    }
    if (result.status === 403) {
      return Response.json(
        governanceDeniedError(result.error, result.decision),
        {
          status: 403,
        }
      );
    }
    return Response.json(
      { error: result.error, decision: result.decision },
      { status: result.status }
    );
  }

  if (idempotencyKey) {
    rememberIdempotencyKey(idempotencyKey, result.data.requestId);
  }

  const body = submitAccessResponseSchema.parse({ data: result.data });
  return Response.json(body, { status: result.status });
}
