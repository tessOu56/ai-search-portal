import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";

import { AccessRequestReviewPanel } from "~/features/accessrequests";
import {
  editAccessApplication,
  expireStaleAccessApplications,
  listAccessApplications,
  reviewAccessApplication,
} from "~/services/access-request-store.server";
import { appendAuditEvent } from "~/services/audit-log.server";
import {
  type GovernanceSessionRole,
  governanceSessionRoleSchema,
  reviewAccessRequestSchema,
} from "~/shared/contracts";

export const meta: MetaFunction = () => [
  { title: "Access review · AI Search Portal" },
  {
    name: "description",
    content: "Owner and admin pending access request queue.",
  },
];

function resolveSessionRole(raw: string | null): GovernanceSessionRole {
  const parsed = governanceSessionRoleSchema.safeParse(raw);
  return parsed.success ? parsed.data : "owner";
}

export function loader({ request }: LoaderFunctionArgs) {
  expireStaleAccessApplications();
  const url = new URL(request.url);
  const sessionRole = resolveSessionRole(url.searchParams.get("sessionRole"));
  const pending = listAccessApplications({ pendingOnly: true });
  return json({ sessionRole, pending });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const requestId = String(form.get("requestId") ?? "");
  const purposeRaw = form.get("purpose");
  const roleRaw = form.get("role");
  const parsed = reviewAccessRequestSchema.safeParse({
    decision: form.get("decision"),
    purpose:
      purposeRaw === "analytics" ||
      purposeRaw === "marketing" ||
      purposeRaw === "operations"
        ? purposeRaw
        : undefined,
    role:
      roleRaw === "analyst" ||
      roleRaw === "data_admin" ||
      roleRaw === "engineer"
        ? roleRaw
        : undefined,
  });
  if (!requestId || !parsed.success) {
    return json(
      { ok: false as const, text: "Invalid review payload" },
      { status: 400 }
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

  if (!updated) {
    return json(
      { ok: false as const, text: "Access request not found" },
      { status: 404 }
    );
  }

  const decisionId = updated.decision?.decision_id ?? `review:${requestId}`;
  appendAuditEvent({
    action:
      parsed.data.decision === "edited"
        ? "access_request.edit"
        : parsed.data.decision === "approved"
          ? "access_request.approve"
          : "access_request.deny",
    actor: { role: updated.role },
    resource: { type: "metadata_asset", id: updated.assetId },
    decisionId,
    requestId: updated.id,
    outcome:
      parsed.data.decision === "edited"
        ? "edited"
        : parsed.data.decision === "approved"
          ? "approved"
          : "denied",
    requireAudit: true,
    reasons: [`review:${parsed.data.decision}`],
  });

  return json({
    ok: true as const,
    text:
      parsed.data.decision === "edited"
        ? `${updated.assetName} edited (still pending)`
        : `${updated.assetName} → ${updated.status}`,
  });
}

export default function AccessRequestsReviewRoute() {
  const { sessionRole, pending } = useLoaderData<typeof loader>();
  const actionMessage = useActionData<typeof action>();
  const navigation = useNavigation();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <AccessRequestReviewPanel
        pending={pending}
        sessionRole={sessionRole}
        actionMessage={actionMessage}
        loading={navigation.state !== "idle"}
      />
    </main>
  );
}
