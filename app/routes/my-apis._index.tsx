import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  data,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { MyApisPanel } from "~/features/accessrequests";
import {
  expireStaleAccessApplications,
  getAccessApplication,
  listAccessApplications,
  submitDraftAccessApplication,
} from "~/services/access-request-store.server";
import {
  assertCanMutateOwn,
  authenticateRequest,
  requireAuthRole,
} from "~/services/auth.server";
import { rejectIfRateLimited } from "~/services/route-guard.server";
import {
  type GovernanceSessionRole,
  governanceSessionRoleSchema,
  type Principal,
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

function myApisFail(text: string, status: number) {
  return data({ ok: false as const, text }, { status });
}

function submitDraftFromForm(user: Principal, form: FormData) {
  const id = String(form.get("requestId") ?? "");
  const current = getAccessApplication(id);
  if (current) {
    const ownGate = assertCanMutateOwn(user, current);
    if (!ownGate.ok) return myApisFail(ownGate.error, ownGate.status);
  }
  const updated = submitDraftAccessApplication(id);
  if (!updated.ok) {
    const conflict = updated.reason === "invalid_transition";
    return myApisFail(
      "Draft not found or already submitted",
      conflict ? 409 : 404
    );
  }
  return data({
    ok: true as const,
    text: `${updated.data.assetName} → ${updated.data.status}`,
  });
}

function expireStaleAsAdmin(user: Principal) {
  const adminGate = requireAuthRole(user, ["admin"]);
  if (!adminGate.ok) return myApisFail(adminGate.error, adminGate.status);
  const expired = expireStaleAccessApplications(0);
  return data({
    ok: true as const,
    text: `Expired ${expired.length} application(s)`,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const limited = rejectIfRateLimited(request, "governanceWrite");
  if (limited) return myApisFail("Too many requests", 429);
  const auth = authenticateRequest(request);
  if (!auth.ok) return myApisFail(auth.error, auth.status);

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "submit-draft") return submitDraftFromForm(auth.user, form);
  if (intent === "expire-stale") return expireStaleAsAdmin(auth.user);
  return data({ ok: false as const, text: "Unknown intent" }, { status: 400 });
}

export async function loader({ request }: LoaderFunctionArgs) {
  expireStaleAccessApplications();
  const url = new URL(request.url);
  const sessionRole = resolveSessionRole(url.searchParams.get("sessionRole"));
  const principal = authenticateRequest(request);
  const applications = principal.ok
    ? listAccessApplications(
        principal.user.authRole === "requester"
          ? { requesterId: principal.user.id }
          : undefined
      )
    : [];
  const highlightId = url.searchParams.get("highlight") ?? undefined;
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  const canonical = getCanonicalUrl(request);
  return data({
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
  const loading =
    navigation.state === "loading" &&
    navigation.formMethod == null &&
    navigation.location?.pathname === "/my-apis";
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
