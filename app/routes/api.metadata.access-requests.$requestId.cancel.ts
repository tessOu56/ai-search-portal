import type { ActionFunctionArgs } from "react-router";

import {
  cancelAccessApplication,
  getAccessApplication,
} from "~/services/access-request-store.server";
import { appendAuditEvent } from "~/services/audit-log.server";
import {
  cancelAccessRequestSchema,
  cancelAccessResponseSchema,
  governanceInvalidTransitionError,
  governancePolicyErrorSchema,
} from "~/shared/contracts";

/**
 * Cancel draft or pending_approval application.
 * POST /api/metadata/access-requests/:requestId/cancel
 */
export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const requestId = params.requestId;
  if (!requestId) {
    return Response.json({ error: "Missing requestId" }, { status: 400 });
  }

  let raw: unknown = {};
  const contentType = request.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      raw = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
  }

  const parsed = cancelAccessRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const current = getAccessApplication(requestId);
  if (!current) {
    return Response.json(
      governancePolicyErrorSchema.parse({
        error: "Access request not found",
        code: "NOT_FOUND",
      }),
      { status: 404 }
    );
  }

  const updated = cancelAccessApplication({ id: requestId });
  if (!updated.ok) {
    return Response.json(
      governanceInvalidTransitionError(
        `Cannot cancel when status is ${current.status}`
      ),
      { status: 409 }
    );
  }

  appendAuditEvent({
    action: "access_request.cancel",
    actor: { role: updated.data.role },
    resource: { type: "metadata_asset", id: updated.data.assetId },
    decisionId: updated.data.decision?.decision_id ?? `cancel:${requestId}`,
    requestId: updated.data.id,
    outcome: "cancelled",
    requireAudit: true,
    reasons: [parsed.data.reason ?? "requester_cancelled"],
  });

  return Response.json(
    cancelAccessResponseSchema.parse({ data: updated.data })
  );
}
