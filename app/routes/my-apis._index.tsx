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

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
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
import { useI18n } from "~/shared/i18n/context";

export const meta: MetaFunction = () => [
  { title: "My requests · Portal" },
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
    if (!updated.ok) {
      return json(
        { ok: false as const, text: "Draft not found or already submitted" },
        { status: updated.reason === "invalid_transition" ? 409 : 404 }
      );
    }
    return json({
      ok: true as const,
      text: `${updated.data.assetName} → ${updated.data.status}`,
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
  const highlightId = url.searchParams.get("highlight") ?? undefined;
  return json({ sessionRole, applications, highlightId });
}

export default function MyApisRoute() {
  const { t } = useI18n();
  const { sessionRole, applications, highlightId } =
    useLoaderData<typeof loader>();
  const actionMessage = useActionData<typeof action>();
  const navigation = useNavigation();
  const loading = navigation.state !== "idle";
  return (
    <ProductPageShell current={t("nav.my-requests")}>
      <MyApisPanel
        applications={applications}
        sessionRole={sessionRole}
        loading={loading}
        actionMessage={actionMessage}
        highlightId={highlightId}
      />
    </ProductPageShell>
  );
}

/** Route-level error state (four-state completeness — mirrors catalog-search / metadata). */
export function ErrorBoundary() {
  const { t } = useI18n();
  return (
    <ProductPageShell current={t("nav.my-requests")}>
      <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-6">
        <h1 className="text-lg font-semibold text-destructive">
          {t("my-apis.error.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong while loading your applications. Reloading
          usually recovers.
        </p>
        <Link
          to="/my-apis?sessionRole=requester"
          className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Reset and retry
        </Link>
      </div>
    </ProductPageShell>
  );
}
