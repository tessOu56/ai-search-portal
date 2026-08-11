import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import {
  getAccessApplication,
  submitDraftAccessApplication,
} from "~/services/access-request-store.server";
import { appendAuditEvent } from "~/services/audit-log.server";
import {
  governanceInvalidTransitionError,
  governancePolicyErrorSchema,
  submitAccessResponseSchema,
  submitDraftAccessRequestSchema,
} from "~/shared/contracts";

/**
 * Promote draft → pending_approval (REST; was form-only on my-apis).
 * POST /api/metadata/access-requests/:requestId/submit
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

  const parsed = submitDraftAccessRequestSchema.safeParse(raw);
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

  const updated = submitDraftAccessApplication(requestId);
  if (!updated.ok) {
    return json(
      governanceInvalidTransitionError(
        `Cannot submit draft when status is ${current.status}`
      ),
      { status: 409 }
    );
  }

  const decision = updated.data.decision;
  if (!decision) {
    return json({ error: "Missing policy decision on draft" }, { status: 500 });
  }

  appendAuditEvent({
    action: "access_request.submit",
    actor: { role: updated.data.role },
    resource: { type: "metadata_asset", id: updated.data.assetId },
    decisionId: decision.decision_id,
    requestId: updated.data.id,
    outcome: "pending_approval",
    requireAudit: decision.require_audit,
    reasons: [...decision.reasons, "draft_submit"],
  });

  const body = submitAccessResponseSchema.parse({
    data: {
      requestId: updated.data.id,
      status: updated.data.status,
      decision,
      auditLogged: decision.require_audit,
    },
  });
  return json(body, { status: 202 });
}
