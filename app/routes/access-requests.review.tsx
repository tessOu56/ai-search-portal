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
import { AccessRequestReviewPanel } from "~/features/accessrequests";
import {
  editAccessApplication,
  expireStaleAccessApplications,
  getAccessApplication,
  listAccessApplications,
  reviewAccessApplication,
} from "~/services/access-request-store.server";
import { appendAuditEvent } from "~/services/audit-log.server";
import { assertCanReview, authenticateRequest } from "~/services/auth.server";
import { rejectIfRateLimited } from "~/services/route-guard.server";
import {
  type GovernanceSessionRole,
  governanceSessionRoleSchema,
  reviewAccessRequestSchema,
} from "~/shared/contracts";
import { getLocale, getTranslations } from "~/shared/i18n";
import { useI18n } from "~/shared/i18n/context";
import { t } from "~/shared/i18n/server";
import { buildSeoMeta, getCanonicalUrl, getSeoFromLoader } from "~/shared/seo";

const ACCESS_REVIEW_TITLE_KEY = "nav.access-review";
const ACCESS_REVIEW_DESCRIPTION_KEY = "access-review.page.description";

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

export async function loader({ request }: LoaderFunctionArgs) {
  expireStaleAccessApplications();
  const url = new URL(request.url);
  const sessionRole = resolveSessionRole(url.searchParams.get("sessionRole"));
  const pending = listAccessApplications({ pendingOnly: true });
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  const canonical = getCanonicalUrl(request);
  return data({
    sessionRole,
    pending,
    title: t(translations, ACCESS_REVIEW_TITLE_KEY),
    description: t(translations, ACCESS_REVIEW_DESCRIPTION_KEY),
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

function reviewFail(text: string, status: number) {
  return data({ ok: false as const, text }, { status });
}

function applyReviewMutation(
  requestId: string,
  parsed: ReturnType<typeof reviewAccessRequestSchema.parse>
) {
  if (parsed.decision === "edited") {
    return editAccessApplication({
      id: requestId,
      purpose: parsed.purpose,
      role: parsed.role,
    });
  }
  return reviewAccessApplication({
    id: requestId,
    decision: parsed.decision,
  });
}

function reviewOutcome(decision: "edited" | "approved" | "denied") {
  if (decision === "edited") return "edited" as const;
  if (decision === "approved") return "approved" as const;
  return "denied" as const;
}

export async function action({ request }: ActionFunctionArgs) {
  const limited = rejectIfRateLimited(request, "governanceWrite");
  if (limited) return reviewFail("Too many requests", 429);

  const auth = authenticateRequest(request);
  if (!auth.ok) return reviewFail(auth.error, auth.status);

  const form = await request.formData();
  const { requestId, parsed } = parseReviewForm(form);
  if (!requestId || !parsed.success) {
    return reviewFail("Invalid review payload", 400);
  }

  const current = getAccessApplication(requestId);
  if (current) {
    const reviewGate = assertCanReview(auth.user, current);
    if (!reviewGate.ok) return reviewFail(reviewGate.error, reviewGate.status);
  }

  const updated = applyReviewMutation(requestId, parsed.data);
  if (!updated.ok) {
    const conflict = updated.reason === "invalid_transition";
    return reviewFail(
      conflict ? "Invalid status transition" : "Access request not found",
      conflict ? 409 : 404
    );
  }

  appendAuditEvent({
    action: auditActionFor(parsed.data.decision),
    actor: { role: auth.user.opaRole, id: auth.user.id },
    resource: { type: "metadata_asset", id: updated.data.assetId },
    decisionId: updated.data.decision?.decision_id ?? `review:${requestId}`,
    requestId: updated.data.id,
    outcome: reviewOutcome(parsed.data.decision),
    requireAudit: true,
    reasons: [`review:${parsed.data.decision}`],
  });

  const edited = parsed.data.decision === "edited";
  return data({
    ok: true as const,
    text: edited
      ? `${updated.data.assetName} edited (still pending)`
      : `${updated.data.assetName} → ${updated.data.status}`,
    requestId: updated.data.id,
    status: updated.data.status,
  });
}

export default function AccessRequestsReviewRoute() {
  const { t } = useI18n();
  const { sessionRole, pending } = useLoaderData<typeof loader>();
  const actionMessage = useActionData<typeof action>();
  const navigation = useNavigation();
  const loading =
    navigation.state === "loading" &&
    navigation.formMethod == null &&
    navigation.location?.pathname === "/access-requests/review";
  return (
    <ProductPageShell current={t(ACCESS_REVIEW_TITLE_KEY)}>
      <AccessRequestReviewPanel
        pending={pending}
        sessionRole={sessionRole}
        actionMessage={actionMessage}
        loading={loading}
      />
    </ProductPageShell>
  );
}

/** Route-level error state (four-state completeness — mirrors catalog-search / metadata). */
export function ErrorBoundary() {
  const { t } = useI18n();
  return (
    <ProductPageShell current={t(ACCESS_REVIEW_TITLE_KEY)}>
      <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-6">
        <h1 className="text-lg font-semibold text-destructive">
          {t("access-review.error.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("access-review.error.body")}
        </p>
        <Button asChild>
          <Link to="/access-requests/review?sessionRole=owner">
            {t("access-review.error.retry")}
          </Link>
        </Button>
      </div>
    </ProductPageShell>
  );
}
