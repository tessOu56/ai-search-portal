import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import {
  editAccessApplication,
  getAccessApplication,
  reviewAccessApplication,
} from "~/services/access-request-store.server";
import { appendAuditEvent } from "~/services/audit-log.server";
import {
  governanceInvalidTransitionError,
  governancePolicyErrorSchema,
  reviewAccessRequestSchema,
  reviewAccessResponseSchema,
  toolExecutionErrorSchema,
} from "~/shared/contracts";

function reviewOutcome(decision: "edited" | "approved" | "denied") {
  if (decision === "edited") return "edited" as const;
  if (decision === "approved") return "approved" as const;
  return "denied" as const;
}

function reviewAuditAction(decision: "edited" | "approved" | "denied") {
  if (decision === "edited") return "access_request.edit" as const;
  if (decision === "approved") return "access_request.approve" as const;
  return "access_request.deny" as const;
}

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const requestId = params.requestId;
  if (!requestId) {
    return json({ error: "Missing requestId" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = reviewAccessRequestSchema.safeParse(raw);
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

  const updated =
    parsed.data.decision === "edited"
      ? editAccessApplication({
          id: requestId,
          purpose: parsed.data.purpose,
          role: parsed.data.role,
        })
      : reviewAccessApplication({
          id: requestId,
          decision: parsed.data.decision,
        });

  if (!updated.ok) {
    if (updated.reason === "not_found") {
      return json(
        governancePolicyErrorSchema.parse({
          error: "Access request not found",
          code: "NOT_FOUND",
        }),
        { status: 404 }
      );
    }
    return json(
      governanceInvalidTransitionError(
        `Cannot ${parsed.data.decision} when status is ${current.status}`
      ),
      { status: 409 }
    );
  }

  const decisionId =
    updated.data.decision?.decision_id ?? `review:${requestId}`;
  const outcome = reviewOutcome(parsed.data.decision);

  appendAuditEvent({
    action: reviewAuditAction(parsed.data.decision),
    actor: { role: updated.data.role },
    resource: { type: "metadata_asset", id: updated.data.assetId },
    decisionId,
    requestId: updated.data.id,
    outcome,
    requireAudit: true,
    reasons: [`review:${parsed.data.decision}`],
  });

  const body = reviewAccessResponseSchema.parse({ data: updated.data });
  return json(body);
}

/** Stable HITL error shape helper for callers. */
export function hitlRequiredBody(tool = "access_request.submit") {
  return toolExecutionErrorSchema.parse({
    code: "HITL_REQUIRED",
    message: "Human confirmation required before executing this tool",
    tool,
    riskLevel: "high",
  });
}
