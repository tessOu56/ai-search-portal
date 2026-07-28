import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";

import { MyApisPanel } from "~/features/accessrequests";
import {
  expireStaleAccessApplications,
  listAccessApplications,
  submitDraftAccessApplication,
} from "~/services/access-request-store.server";
import {
  type GovernanceSessionRole,
  governanceSessionRoleSchema,
} from "~/shared/contracts";

export const meta: MetaFunction = () => [
  { title: "My APIs · AI Search Portal" },
  {
    name: "description",
    content: "Track metadata access applications and permission status.",
  },
];

function resolveSessionRole(raw: string | null): GovernanceSessionRole {
  const parsed = governanceSessionRoleSchema.safeParse(raw);
  return parsed.success ? parsed.data : "requester";
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "submit-draft") {
    const id = String(form.get("requestId") ?? "");
    const updated = submitDraftAccessApplication(id);
    if (!updated) {
      return json(
        { ok: false as const, text: "Draft not found or already submitted" },
        { status: 404 }
      );
    }
    return json({
      ok: true as const,
      text: `${updated.assetName} → ${updated.status}`,
    });
  }
  if (intent === "expire-stale") {
    const expired = expireStaleAccessApplications(0);
    return json({
      ok: true as const,
      text: `Expired ${expired.length} application(s)`,
    });
  }
  return json({ ok: false as const, text: "Unknown intent" }, { status: 400 });
}

export function loader({ request }: LoaderFunctionArgs) {
  expireStaleAccessApplications();
  const url = new URL(request.url);
  const sessionRole = resolveSessionRole(url.searchParams.get("sessionRole"));
  const applications =
    sessionRole === "requester" ? listAccessApplications() : [];
  return json({ sessionRole, applications });
}

export default function MyApisRoute() {
  const { sessionRole, applications } = useLoaderData<typeof loader>();
  const actionMessage = useActionData<typeof action>();
  const navigation = useNavigation();
  const loading = navigation.state !== "idle";
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <MyApisPanel
        applications={applications}
        sessionRole={sessionRole}
        loading={loading}
        actionMessage={actionMessage}
      />
    </main>
  );
}
