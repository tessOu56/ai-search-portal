import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

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
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const requestId = params.requestId;
  if (!requestId) {
    return json({ error: "Missing requestId" }, { status: 400 });
  }

  let raw: unknown = {};
  const contentType = request.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      raw = await request.json();
    } catch {
      return json({ error: "Invalid JSON payload" }, { status: 400 });
    }
  }

  const parsed = cancelAccessRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const current = getAccessApplication(requestId);
  if (!current) {
    return json(
      governancePolicyErrorSchema.parse({
        error: "Access request not found",
        code: "NOT_FOUND",
      }),
      { status: 404 }
    );
  }

  const updated = cancelAccessApplication({ id: requestId });
  if (!updated.ok) {
    return json(
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

  return json(cancelAccessResponseSchema.parse({ data: updated.data }));
}
