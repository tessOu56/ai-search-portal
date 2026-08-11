import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";

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

function parseReviewForm(form: FormData) {
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
  return { requestId, parsed };
}

function auditActionFor(decision: "edited" | "approved" | "denied") {
  if (decision === "edited") return "access_request.edit" as const;
  return decision === "approved"
    ? ("access_request.approve" as const)
    : ("access_request.deny" as const);
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
  const { requestId, parsed } = parseReviewForm(form);
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

  if (!updated.ok) {
    return json(
      {
        ok: false as const,
        text:
          updated.reason === "invalid_transition"
            ? "Invalid status transition"
            : "Access request not found",
      },
      { status: updated.reason === "invalid_transition" ? 409 : 404 }
    );
  }

  const decisionId =
    updated.data.decision?.decision_id ?? `review:${requestId}`;
  appendAuditEvent({
    action: auditActionFor(parsed.data.decision),
    actor: { role: updated.data.role },
    resource: { type: "metadata_asset", id: updated.data.assetId },
    decisionId,
    requestId: updated.data.id,
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
        ? `${updated.data.assetName} edited (still pending)`
        : `${updated.data.assetName} → ${updated.data.status}`,
    requestId: updated.data.id,
    status: updated.data.status,
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

/** Route-level error state (four-state completeness — mirrors catalog-search / metadata). */
export function ErrorBoundary() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-6">
        <h1 className="text-lg font-semibold text-destructive">
          Access review hit an error
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong while loading the pending queue. Reloading
          usually recovers.
        </p>
        <Link
          to="/access-requests/review?sessionRole=owner"
          className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Reset and retry
        </Link>
      </div>
    </main>
  );
}
