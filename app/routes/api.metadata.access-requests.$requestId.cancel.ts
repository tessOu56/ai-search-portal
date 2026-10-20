import type { ActionFunctionArgs } from "react-router";

import {
  cancelAccessApplication,
  getAccessApplication,
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

  const ownGate = assertCanMutateOwn(auth.user, current);
  if (!ownGate.ok) return authFailureResponse(ownGate);

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
    actor: { role: auth.user.opaRole, id: auth.user.id },
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
