import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";

import { AccessRequestReviewPanel } from "~/features/accessrequests";
import {
  listAccessApplications,
  reviewAccessApplication,
} from "~/services/access-request-store.server";
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
  const url = new URL(request.url);
  const sessionRole = resolveSessionRole(url.searchParams.get("sessionRole"));
  const pending = listAccessApplications({ pendingOnly: true });
  return json({ sessionRole, pending });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const requestId = String(form.get("requestId") ?? "");
  const parsed = reviewAccessRequestSchema.safeParse({
    decision: form.get("decision"),
  });
  if (!requestId || !parsed.success) {
    return json(
      { ok: false as const, text: "Invalid review payload" },
      { status: 400 }
    );
  }
  const updated = reviewAccessApplication({
    id: requestId,
    decision: parsed.data.decision,
  });
  if (!updated) {
    return json(
      { ok: false as const, text: "Access request not found" },
      { status: 404 }
    );
  }
  return json({
    ok: true as const,
    text: `${updated.assetName} → ${updated.status}`,
  });
}

export default function AccessRequestsReviewRoute() {
  const { sessionRole, pending } = useLoaderData<typeof loader>();
  const actionMessage = useActionData<typeof action>();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <AccessRequestReviewPanel
        pending={pending}
        sessionRole={sessionRole}
        actionMessage={actionMessage}
      />
    </main>
  );
}
