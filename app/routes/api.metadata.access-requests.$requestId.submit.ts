import type { ActionFunctionArgs } from "react-router";

import {
  getAccessApplication,
  submitDraftAccessApplication,
} from "~/services/access-request-store.server";
import { appendAuditEvent } from "~/services/audit-log.server";
import {
  assertCanMutateOwn,
  authFailureResponse,
} from "~/services/auth.server";
import {
  jsonBodyErrorResponse,
  readJsonBody,
} from "~/services/request-body.server";
import {
  rejectIfRateLimited,
  requirePrincipal,
} from "~/services/route-guard.server";
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
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const limited = rejectIfRateLimited(request, "governanceWrite");
  if (limited) return limited;

  const auth = requirePrincipal(request);
  if ("response" in auth) return auth.response;

  const requestId = params.requestId;
  if (!requestId) {
    return Response.json({ error: "Missing requestId" }, { status: 400 });
  }

  let raw: unknown = {};
  const contentType = request.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    const parsedBody = await readJsonBody(request);
    if (!parsedBody.ok) return jsonBodyErrorResponse(parsedBody);
    raw = parsedBody.value;
  }

  const parsed = submitDraftAccessRequestSchema.safeParse(raw);
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

  const ownGate = assertCanMutateOwn(auth.user, current);
  if (!ownGate.ok) return authFailureResponse(ownGate);

  const updated = submitDraftAccessApplication(requestId);
  if (!updated.ok) {
    return Response.json(
      governanceInvalidTransitionError(
        `Cannot submit draft when status is ${current.status}`
      ),
      { status: 409 }
    );
  }

  const decision = updated.data.decision;
  if (!decision) {
    return Response.json(
      { error: "Missing policy decision on draft" },
      { status: 500 }
    );
  }

  appendAuditEvent({
    action: "access_request.submit",
    actor: { role: auth.user.opaRole, id: auth.user.id },
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
  return Response.json(body, { status: 202 });
}
