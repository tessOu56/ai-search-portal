import { FormField } from "@is_tess/components";
import { lazy, Suspense, useRef } from "react";
import { Link, useFetcher, useSearchParams, useSubmit } from "react-router";

const AiFallbackPanel = lazy(async () => {
  const mod = await import("~/components/shared/chat/AiFallbackPanel");
  return { default: mod.AiFallbackPanel };
});
import { GenUiRenderer } from "~/components/shared/genui";
import { AccessRequestLifecycleStepper } from "~/components/shared/governance";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Panel } from "~/components/ui/Panel";
import { Select } from "~/components/ui/Select";
import { PRODUCT_TABLE_LINK_CLASS } from "~/lib/experience-nav";
import type {
  AccessApplicationContract,
  GenUiDocumentContract,
  MetadataAssetDetailContract,
  PolicyDecisionContract,
} from "~/shared/contracts";
import { useI18n } from "~/shared/i18n/context";
import { myApisHighlightHref } from "~/shared/navigation";
import { cn } from "~/shared/utils/cn";

const AI_BADGE_KEY = "metadata.access.ai.badge";

const PURPOSE_OPTIONS = [
  { value: "analytics", label: "analytics" },
  { value: "marketing", label: "marketing" },
  { value: "operations", label: "operations" },
];

const ROLE_OPTIONS = [
  { value: "analyst", label: "analyst" },
  { value: "engineer", label: "engineer" },
  { value: "data_admin", label: "data_admin" },
];

export type MetadataAssetSubmitResult = {
  ok: boolean;
  message: string;
  requestId?: string;
  status?: string;
};

export type MetadataAssetDetailProps = {
  asset: MetadataAssetDetailContract;
  genUiDocument: GenUiDocumentContract;
  policyDecision: PolicyDecisionContract;
  role: string;
  purpose: string;
  aiAccessRequest: AiAccessRequestState;
  /** Most recent application by this requester on this asset (lifecycle stepper). */
  existingApplication?: AccessApplicationContract | null;
  /** No-JS fallback submit result (real actionData); fetcher.data wins when present. */
  submitResult?: MetadataAssetSubmitResult;
};

type AiAccessRequestState =
  | { status: "idle" }
  | {
      status: "valid";
      request: {
        assetId: string;
        purpose: "analytics" | "marketing" | "operations";
        role?: "analyst" | "data_admin" | "engineer";
        approved?: boolean;
      };
      genUiDocument: GenUiDocumentContract;
      rationale: string;
    }
  | { status: "invalid"; query: string; reason: string };

function buildConfirmHref(
  purpose: string,
  role: string,
  confirm: boolean,
  options?: { aiFill?: boolean }
): string {
  const sp = new URLSearchParams();
  sp.set("purpose", purpose);
  sp.set("role", role);
  if (confirm) sp.set("confirm", "1");
  if (options?.aiFill) sp.set("aiFill", "1");
  return `?${sp.toString()}`;
}

function humanPolicySummary(
  decision: PolicyDecisionContract,
  t: (key: string) => string
): string {
  if (decision.need_approval) return t("metadata.access.policy.needApproval");
  if (decision.allow) return t("metadata.access.policy.allow");
  return t("metadata.access.policy.deny");
}

/** Approve-outcome deep link into My APIs (requester view) — T-186 #5. */
function ApprovedTrackingLink({ requestId }: { requestId: string }) {
  const { t } = useI18n();
  return (
    <p className="text-sm">
      <Link
        to={myApisHighlightHref(requestId)}
        className={PRODUCT_TABLE_LINK_CLASS}
      >
        {t("nav.my-requests.view")}
      </Link>
    </p>
  );
}

function SubmitResultBanner({
  result,
}: {
  result?: MetadataAssetSubmitResult;
}) {
  const { t } = useI18n();
  if (!result) return null;
  return (
    <div className="space-y-2">
      <p
        className={
          result.ok
            ? "text-sm font-medium text-foreground"
            : "text-sm text-destructive"
        }
        role="status"
      >
        {result.message}
      </p>
      {result.ok ? (
        <p className="text-sm">
          <Link
            to="/my-apis?sessionRole=requester"
            className={PRODUCT_TABLE_LINK_CLASS}
          >
            {t("nav.my-requests.track")}
          </Link>
          {" · "}
          <Link
            to="/access-requests/review?sessionRole=owner"
            className={PRODUCT_TABLE_LINK_CLASS}
          >
            {t("my-apis.reviewQueue")}
          </Link>
        </p>
      ) : null}
      {result.ok && result.status === "approved" && result.requestId ? (
        <ApprovedTrackingLink requestId={result.requestId} />
      ) : null}
    </div>
  );
}

/** GET-driven purpose/role selector — writes to the URL so decisions stay shareable (T-186 #1). */
function AccessContextForm({
  purpose,
  role,
}: {
  purpose: string;
  role: string;
}) {
  const { t } = useI18n();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  const [searchParams] = useSearchParams();
  const packParam = searchParams.get("pack");
  const aiFillParam = searchParams.get("aiFill");

  function submitContext() {
    if (formRef.current) void submit(formRef.current, { method: "get" });
  }

  return (
    <Panel>
      <div className="mb-3 space-y-1">
        <h2 className="text-type-16 font-semibold text-foreground">
          {t("metadata.access.context.title")}
        </h2>
        <p className="text-type-14 text-muted-foreground">
          {t("metadata.access.context.desc")}
        </p>
      </div>
      <div>
        <form
          ref={formRef}
          method="get"
          className="flex flex-wrap items-end gap-space-16"
          aria-label={t("metadata.access.context.title")}
        >
          {packParam ? (
            <input type="hidden" name="pack" value={packParam} />
          ) : null}
          {aiFillParam ? (
            <input type="hidden" name="aiFill" value={aiFillParam} />
          ) : null}
          <FormField
            id="access-context-purpose"
            label={t("metadata.access.purpose")}
            aiFilled={Boolean(aiFillParam)}
            aiBadgeLabel={t(AI_BADGE_KEY)}
          >
            <Select
              id="access-context-purpose"
              name="purpose"
              defaultValue={purpose}
              className="w-full"
              options={PURPOSE_OPTIONS}
              onValueChange={submitContext}
            />
          </FormField>
          <FormField
            id="access-context-role"
            label={t("metadata.access.role")}
            aiFilled={Boolean(aiFillParam)}
            aiBadgeLabel={t(AI_BADGE_KEY)}
          >
            <Select
              id="access-context-role"
              name="role"
              defaultValue={role}
              className="w-full"
              options={ROLE_OPTIONS}
              onValueChange={submitContext}
            />
          </FormField>
          <noscript>
            <Button type="submit" size="sm" variant="outline">
              {t("metadata.access.update")}
            </Button>
          </noscript>
        </form>
      </div>
    </Panel>
  );
}

function AccessRequestPanel({
  policyDecision,
  role,
  purpose,
  submitResult,
}: {
  policyDecision: PolicyDecisionContract;
  role: string;
  purpose: string;
  submitResult?: MetadataAssetSubmitResult;
}) {
  // URL-driven HITL step (not useState) so E2E / dual-path work without waiting on hydration.
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const showConfirm = searchParams.get("confirm") === "1";
  const canRequest = policyDecision.allow || policyDecision.need_approval;
  const fetcher = useFetcher<MetadataAssetSubmitResult>();
  const effectiveResult = fetcher.data ?? submitResult;
  const busy = fetcher.state !== "idle";
  const submitted = Boolean(effectiveResult?.ok);
  const phase = submitted ? "done" : showConfirm ? "confirm" : "cta";
  const requestLabel = t("metadata.access.request");

  return (
    <Panel>
      <div className="mb-3 space-y-1">
        <h2 className="text-type-16 font-semibold text-foreground">
          {t("metadata.access.request.title")}
        </h2>
        <p className="text-type-14 text-muted-foreground">
          {t("metadata.access.request.meta", { role, purpose })}
        </p>
      </div>
      <div className="space-y-4">
        <SubmitResultBanner result={effectiveResult} />

        {phase === "cta" ? (
          canRequest ? (
            <Button asChild>
              <Link to={buildConfirmHref(purpose, role, true)}>
                {requestLabel}
              </Link>
            </Button>
          ) : (
            <div className="space-y-space-8">
              <Button type="button" disabled>
                {requestLabel}
              </Button>
              <p className="text-type-14 text-muted-foreground">
                {t("metadata.access.policy.deny")}
              </p>
            </div>
          )
        ) : null}

        {phase === "confirm" ? (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm font-medium">
              {policyDecision.need_approval
                ? t("metadata.access.confirmHitl")
                : t("metadata.access.confirmGeneric")}
            </p>
            {policyDecision.need_approval ? (
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {policyDecision.reasons.map((r) => (
                  <li key={`confirm-${r}`}>{r}</li>
                ))}
              </ul>
            ) : null}
            <fetcher.Form method="post" className="flex flex-wrap gap-space-8">
              <input type="hidden" name="intent" value="access-request" />
              <input type="hidden" name="purpose" value={purpose} />
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="approved" value="true" />
              <Button type="submit" disabled={busy}>
                {busy
                  ? t("metadata.access.submitting")
                  : t("metadata.access.confirm")}
              </Button>
              <Button
                type="submit"
                name="asDraft"
                value="true"
                variant="outline"
                disabled={busy}
              >
                {t("metadata.access.saveDraft")}
              </Button>
              <Button asChild variant="ghost">
                <Link to={buildConfirmHref(purpose, role, false)}>
                  {t("metadata.access.cancel")}
                </Link>
              </Button>
            </fetcher.Form>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function AiAccessRequestPanel({
  aiAccessRequest,
  policyDecision,
  submitResult,
}: {
  aiAccessRequest: Exclude<AiAccessRequestState, { status: "idle" }>;
  policyDecision: PolicyDecisionContract;
  submitResult?: MetadataAssetSubmitResult;
}) {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const showConfirm = searchParams.get("confirm") === "1";
  const fetcher = useFetcher<MetadataAssetSubmitResult>();
  const effectiveResult = fetcher.data ?? submitResult;
  const busy = fetcher.state !== "idle";
  const submitted = Boolean(effectiveResult?.ok);

  if (aiAccessRequest.status === "invalid") {
    return (
      <div className="space-y-4">
        <Suspense fallback={null}>
          <AiFallbackPanel query={aiAccessRequest.query} types={["Dataset"]} />
        </Suspense>
        <p className="text-sm text-muted-foreground" role="alert">
          {aiAccessRequest.reason}
        </p>
      </div>
    );
  }

  const requestRole = aiAccessRequest.request.role ?? "analyst";
  const canRequest = policyDecision.allow || policyDecision.need_approval;

  return (
    <Panel>
      <div className="mb-3 space-y-1">
        <h2 className="text-type-16 font-semibold text-foreground">
          {t("metadata.access.ai.title")}
        </h2>
        <p className="text-type-14 text-muted-foreground">
          {t("metadata.access.ai.desc")}
        </p>
      </div>
      <div className="space-y-4">
        <SubmitResultBanner result={effectiveResult} />

        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            {aiAccessRequest.rationale}
          </p>
          <GenUiRenderer document={aiAccessRequest.genUiDocument} />
        </div>

        <div className="flex flex-wrap gap-space-8">
          <Badge variant="secondary">
            purpose: {aiAccessRequest.request.purpose}
          </Badge>
          <Badge variant="outline">role: {requestRole}</Badge>
        </div>

        {submitted ? null : !showConfirm ? (
          canRequest ? (
            <Button asChild>
              <Link
                to={buildConfirmHref(
                  aiAccessRequest.request.purpose,
                  requestRole,
                  true,
                  { aiFill: true }
                )}
              >
                {t("metadata.access.ai.review")}
              </Link>
            </Button>
          ) : (
            <Button type="button" disabled>
              {t("metadata.access.ai.review")}
            </Button>
          )
        ) : (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm font-medium">
              {t("metadata.access.ai.confirmTitle")}
            </p>
            {policyDecision.need_approval ? (
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {policyDecision.reasons.map((r) => (
                  <li key={`ai-confirm-${r}`}>{r}</li>
                ))}
              </ul>
            ) : null}
            <fetcher.Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="access-request" />
              <input type="hidden" name="approved" value="true" />
              <div className="flex flex-wrap gap-space-16">
                <FormField
                  id="ai-request-purpose"
                  label={t("metadata.access.purpose")}
                  aiFilled
                  aiBadgeLabel={t(AI_BADGE_KEY)}
                  className="w-40"
                >
                  <Select
                    id="ai-request-purpose"
                    name="purpose"
                    defaultValue={aiAccessRequest.request.purpose}
                    className="w-full"
                    options={PURPOSE_OPTIONS}
                  />
                </FormField>
                <FormField
                  id="ai-request-role"
                  label={t("metadata.access.role")}
                  aiFilled
                  aiBadgeLabel={t(AI_BADGE_KEY)}
                  className="w-40"
                >
                  <Select
                    id="ai-request-role"
                    name="role"
                    defaultValue={requestRole}
                    className="w-full"
                    options={ROLE_OPTIONS}
                  />
                </FormField>
              </div>
              <div className="flex flex-wrap gap-space-8">
                <Button type="submit" disabled={busy}>
                  {busy
                    ? t("metadata.access.submitting")
                    : t("metadata.access.ai.confirm")}
                </Button>
                <Button asChild variant="outline">
                  <Link
                    to={buildConfirmHref(
                      aiAccessRequest.request.purpose,
                      requestRole,
                      false,
                      { aiFill: true }
                    )}
                  >
                    {t("metadata.access.cancel")}
                  </Link>
                </Button>
              </div>
            </fetcher.Form>
          </div>
        )}
      </div>
    </Panel>
  );
}

function DataContractCard({ asset }: { asset: MetadataAssetDetailContract }) {
  const { t } = useI18n();
  return (
    <Panel>
      <div className="mb-3 space-y-1">
        <h2 className="text-type-16 font-semibold text-foreground">
          {t("metadata.contract.title")}
        </h2>
        <p className="text-type-14 text-muted-foreground">
          {t("metadata.contract.desc")}
        </p>
      </div>
      <div className="space-y-3 text-sm">
        <p>
          <span className="text-muted-foreground">Owner:</span>{" "}
          {asset.owner ? (
            asset.owner
          ) : (
            <Badge variant="outline">Unassigned — needs owner</Badge>
          )}
        </p>
        {asset.department && (
          <p>
            <span className="text-muted-foreground">Department:</span>{" "}
            {asset.department}
          </p>
        )}
        <p>
          <span className="text-muted-foreground">Classification:</span>{" "}
          <Badge
            variant={asset.classification === "PII" ? "secondary" : "outline"}
          >
            {asset.classification}
          </Badge>
          {asset.dataContractId ? (
            <span className="ml-2 text-muted-foreground">
              contract: {asset.dataContractId}
            </span>
          ) : null}
        </p>
        {asset.columns && asset.columns.length > 0 ? (
          <div>
            <p className="mb-1 font-medium">Fields</p>
            <ul className="space-y-1 text-muted-foreground">
              {asset.columns.map((col) => (
                <li key={col.name} className="flex flex-wrap gap-space-8">
                  <span className="text-foreground">{col.name}</span>
                  <span>{col.dataType}</span>
                  {col.sensitive ? (
                    <Badge variant="secondary">PII / sensitive</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {asset.termsOfUse && asset.termsOfUse.length > 0 ? (
          <div>
            <p className="mb-1 font-medium">Terms of use</p>
            <ul className="list-inside list-disc text-muted-foreground">
              {asset.termsOfUse.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted-foreground">No terms attached.</p>
        )}
      </div>
    </Panel>
  );
}

function AccessPolicyCard({
  policyDecision,
}: {
  policyDecision: PolicyDecisionContract;
}) {
  const { t } = useI18n();
  return (
    <Panel>
      <div className="mb-3 space-y-1">
        <h2 className="text-type-16 font-semibold text-foreground">
          {t("metadata.access.policy.title")}
        </h2>
        <p className="text-type-14 text-muted-foreground">
          {t("metadata.access.policy.desc")}
        </p>
      </div>
      <div className="space-y-4 text-sm">
        <p>{humanPolicySummary(policyDecision, t)}</p>
        <div className="flex flex-wrap gap-space-8">
          <Badge variant={policyDecision.allow ? "default" : "outline"}>
            allow: {String(policyDecision.allow)}
          </Badge>
          <Badge
            variant={policyDecision.need_approval ? "secondary" : "outline"}
          >
            need_approval: {String(policyDecision.need_approval)}
          </Badge>
          {policyDecision.require_audit ? (
            <Badge variant="outline">audit required</Badge>
          ) : null}
        </div>
        {policyDecision.require_audit ? (
          <p className="text-muted-foreground">
            {t("metadata.access.policy.audit")}
          </p>
        ) : null}

        <details
          className={cn(
            "rounded-lg border border-border p-3",
            "[&_summary]:cursor-pointer [&_summary]:select-none"
          )}
          data-testid="policy-debug-drawer"
        >
          <summary className="text-sm font-medium text-muted-foreground">
            {t("metadata.access.policy.debug")}
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-type-12 text-muted-foreground">
              decision_id: {policyDecision.decision_id}
            </p>
            {policyDecision.mask_fields.length > 0 ? (
              <p className="text-type-12 text-muted-foreground">
                masked fields: {policyDecision.mask_fields.join(", ")}
              </p>
            ) : null}
            <ul className="list-inside list-disc text-muted-foreground">
              {policyDecision.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </Panel>
  );
}

function AssetLineageLists({ asset }: { asset: MetadataAssetDetailContract }) {
  return (
    <div className="flex flex-wrap gap-space-16 text-sm">
      <div>
        <h3 className="mb-2 font-medium">Upstream</h3>
        <ul className="space-y-1 text-muted-foreground">
          {asset.upstreamIds.map((id) => (
            <li key={id}>
              <Link to={`/metadata/${id}`} className={PRODUCT_TABLE_LINK_CLASS}>
                {id}
              </Link>
            </li>
          ))}
          {asset.upstreamIds.length === 0 ? <li>—</li> : null}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-medium">Downstream</h3>
        <ul className="space-y-1 text-muted-foreground">
          {asset.downstreamIds.map((id) => (
            <li key={id}>
              <Link to={`/metadata/${id}`} className={PRODUCT_TABLE_LINK_CLASS}>
                {id}
              </Link>
            </li>
          ))}
          {asset.downstreamIds.length === 0 ? <li>—</li> : null}
        </ul>
      </div>
    </div>
  );
}

function ExistingApplicationCard({
  application,
}: {
  application: AccessApplicationContract;
}) {
  const { t } = useI18n();
  return (
    <Panel data-testid="existing-application-card">
      <div className="mb-3 space-y-2">
        <h2 className="text-type-16 font-semibold text-foreground">
          {t("metadata.access.existing.title")}
        </h2>
        <p className="text-type-14 text-muted-foreground">
          {t("metadata.access.existing.meta", {
            purpose: application.purpose,
            role: application.role,
            date: new Date(application.createdAt).toLocaleDateString(),
          })}
        </p>
        <AccessRequestLifecycleStepper status={application.status} />
      </div>
      <div>
        <Link
          to={myApisHighlightHref(application.id)}
          className={`text-sm ${PRODUCT_TABLE_LINK_CLASS}`}
        >
          {t("nav.my-requests.view")}
        </Link>
      </div>
    </Panel>
  );
}

function AssetFaqCard({ asset }: { asset: MetadataAssetDetailContract }) {
  return (
    <Panel data-testid="asset-faq">
      <h2 className="mb-space-16 text-type-16 font-semibold text-foreground">
        About this asset
      </h2>
      <dl className="space-y-space-16 text-type-14">
        <div>
          <dt className="text-muted-foreground">Who owns it?</dt>
          <dd className="text-foreground">{asset.owner || "Unassigned"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Can I query it now?</dt>
          <dd className="text-foreground">
            {asset.classification === "public"
              ? "Public classification — still request access in this showcase."
              : `${asset.classification} data needs an access request before use.`}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">How do I request access?</dt>
          <dd className="text-foreground">
            Choose purpose and role on this page, submit, then track the request
            in My requests.
          </dd>
        </div>
      </dl>
    </Panel>
  );
}

export function MetadataAssetDetailView({
  asset,
  genUiDocument,
  policyDecision,
  role,
  purpose,
  aiAccessRequest,
  existingApplication,
  submitResult,
}: MetadataAssetDetailProps) {
  return (
    <div className="space-y-6">
      <GenUiRenderer document={genUiDocument} />

      <DataContractCard asset={asset} />

      <AccessContextForm purpose={purpose} role={role} />

      {existingApplication ? (
        <ExistingApplicationCard application={existingApplication} />
      ) : null}

      <AccessPolicyCard policyDecision={policyDecision} />

      {aiAccessRequest.status === "idle" ? (
        <AccessRequestPanel
          policyDecision={policyDecision}
          role={role}
          purpose={purpose}
          submitResult={submitResult}
        />
      ) : (
        <AiAccessRequestPanel
          aiAccessRequest={aiAccessRequest}
          policyDecision={policyDecision}
          submitResult={submitResult}
        />
      )}

      <AssetLineageLists asset={asset} />
      <AssetFaqCard asset={asset} />
    </div>
  );
}
