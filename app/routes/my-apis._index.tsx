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
import { Button } from "~/components/ui/Button";
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
import { getLocale, getTranslations } from "~/shared/i18n";
import { useI18n } from "~/shared/i18n/context";
import { t } from "~/shared/i18n/server";
import { buildSeoMeta, getCanonicalUrl, getSeoFromLoader } from "~/shared/seo";

const MY_REQUESTS_TITLE_KEY = "nav.my-requests";

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

export async function loader({ request }: LoaderFunctionArgs) {
  expireStaleAccessApplications();
  const url = new URL(request.url);
  const sessionRole = resolveSessionRole(url.searchParams.get("sessionRole"));
  const applications =
    sessionRole === "requester" ? listAccessApplications() : [];
  const highlightId = url.searchParams.get("highlight") ?? undefined;
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  const canonical = getCanonicalUrl(request);
  return json({
    sessionRole,
    applications,
    highlightId,
    title: t(translations, MY_REQUESTS_TITLE_KEY),
    description: t(translations, "my-apis.page.description"),
    canonical,
    locale: locale.replace("-", "_"),
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const seo = getSeoFromLoader(data);
  return buildSeoMeta({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
    locale: seo.locale,
    type: "website",
  });
};

export default function MyApisRoute() {
  const { t } = useI18n();
  const { sessionRole, applications, highlightId } =
    useLoaderData<typeof loader>();
  const actionMessage = useActionData<typeof action>();
  const navigation = useNavigation();
  const loading = navigation.state !== "idle";
  return (
    <ProductPageShell current={t(MY_REQUESTS_TITLE_KEY)}>
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
    <ProductPageShell current={t(MY_REQUESTS_TITLE_KEY)}>
      <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-6">
        <h1 className="text-lg font-semibold text-destructive">
          {t("my-apis.error.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("my-apis.error.body")}
        </p>
        <Button asChild>
          <Link to="/my-apis?sessionRole=requester">
            {t("my-apis.error.retry")}
          </Link>
        </Button>
      </div>
    </ProductPageShell>
  );
}
