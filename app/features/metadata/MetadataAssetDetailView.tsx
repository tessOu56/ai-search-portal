import { FormField } from "@explore-design/components";
import { Link, useFetcher, useSearchParams, useSubmit } from "@remix-run/react";
import type { FormEvent } from "react";

import { AiFallbackPanel } from "~/components/shared/chat/AiFallbackPanel";
import { GenUiRenderer } from "~/components/shared/genui";
import { AccessRequestLifecycleStepper } from "~/components/shared/governance";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
import type {
  AccessApplicationContract,
  GenUiDocumentContract,
  MetadataAssetDetailContract,
  PolicyDecisionContract,
} from "~/shared/contracts";
import { myApisHighlightHref } from "~/shared/navigation";
import { cn } from "~/shared/utils/cn";

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

function humanPolicySummary(decision: PolicyDecisionContract): string {
  if (decision.need_approval) {
    return "This request needs sign-off from the data owner before access is granted.";
  }
  if (decision.allow) {
    return "You meet the requirements for this purpose and role — access can be granted right away.";
  }
  return "Access isn't allowed for this purpose and role.";
}

/** Approve-outcome deep link into My APIs (requester view) — T-186 #5. */
function ApprovedTrackingLink({ requestId }: { requestId: string }) {
  return (
    <p className="text-sm">
      <Link
        to={myApisHighlightHref(requestId)}
        className="text-primary hover:underline"
      >
        View in My APIs (requester view) →
      </Link>
    </p>
  );
}

function SubmitResultBanner({
  result,
}: {
  result?: MetadataAssetSubmitResult;
}) {
  if (!result) return null;
  return (
    <div className="space-y-2">
      <p
        className={
          result.ok ? "text-sm text-green-700" : "text-sm text-destructive"
        }
        role="status"
      >
        {result.message}
      </p>
      {result.ok ? (
        <p className="text-sm">
          <Link
            to="/my-apis?sessionRole=requester"
            className="text-primary hover:underline"
          >
            Track in My APIs
          </Link>
          {" · "}
          <Link
            to="/access-requests/review?sessionRole=owner"
            className="text-primary hover:underline"
          >
            Owner review queue
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
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const packParam = searchParams.get("pack");
  const aiFillParam = searchParams.get("aiFill");

  function handleChange(event: FormEvent<HTMLFormElement>) {
    submit(event.currentTarget, { method: "get" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Access context</CardTitle>
        <CardDescription>
          Purpose and role drive the policy decision below — changing them
          updates this page&apos;s URL so the exact scenario stays shareable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          method="get"
          onChange={handleChange}
          className="flex flex-wrap items-end gap-4"
          aria-label="Access context"
        >
          {packParam ? (
            <input type="hidden" name="pack" value={packParam} />
          ) : null}
          {aiFillParam ? (
            <input type="hidden" name="aiFill" value={aiFillParam} />
          ) : null}
          <FormField
            id="access-context-purpose"
            label="Purpose"
            aiFilled={Boolean(aiFillParam)}
            aiBadgeLabel="AI suggested"
          >
            <select
              id="access-context-purpose"
              name="purpose"
              defaultValue={purpose}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="analytics">analytics</option>
              <option value="marketing">marketing</option>
              <option value="operations">operations</option>
            </select>
          </FormField>
          <FormField
            id="access-context-role"
            label="Role"
            aiFilled={Boolean(aiFillParam)}
            aiBadgeLabel="AI suggested"
          >
            <select
              id="access-context-role"
              name="role"
              defaultValue={role}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="analyst">analyst</option>
              <option value="engineer">engineer</option>
              <option value="data_admin">data_admin</option>
            </select>
          </FormField>
          <noscript>
            <Button type="submit" size="sm" variant="outline">
              Update
            </Button>
          </noscript>
        </form>
      </CardContent>
    </Card>
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
  const [searchParams] = useSearchParams();
  const showConfirm = searchParams.get("confirm") === "1";
  const canRequest = policyDecision.allow || policyDecision.need_approval;
  const fetcher = useFetcher<MetadataAssetSubmitResult>();
  const effectiveResult = fetcher.data ?? submitResult;
  const busy = fetcher.state !== "idle";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request access</CardTitle>
        <CardDescription>
          Role: {role} · Purpose: {purpose}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SubmitResultBanner result={effectiveResult} />

        {!showConfirm ? (
          canRequest ? (
            <Button asChild>
              <Link to={buildConfirmHref(purpose, role, true)}>
                Request access
              </Link>
            </Button>
          ) : (
            <Button type="button" disabled>
              Request access
            </Button>
          )
        ) : (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm font-medium">
              {policyDecision.need_approval
                ? "Human confirmation required (HITL)"
                : "Confirm access request"}
            </p>
            {policyDecision.need_approval ? (
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {policyDecision.reasons.map((r) => (
                  <li key={`confirm-${r}`}>{r}</li>
                ))}
              </ul>
            ) : null}
            <fetcher.Form method="post" className="flex flex-wrap gap-2">
              <input type="hidden" name="intent" value="access-request" />
              <input type="hidden" name="purpose" value={purpose} />
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="approved" value="true" />
              <Button type="submit" disabled={busy}>
                {busy ? "Submitting…" : "Confirm"}
              </Button>
              <Button
                type="submit"
                name="asDraft"
                value="true"
                variant="outline"
                disabled={busy}
              >
                Save draft
              </Button>
              <Button asChild variant="ghost">
                <Link to={buildConfirmHref(purpose, role, false)}>Cancel</Link>
              </Button>
            </fetcher.Form>
          </div>
        )}
      </CardContent>
    </Card>
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
  const [searchParams] = useSearchParams();
  const showConfirm = searchParams.get("confirm") === "1";
  const fetcher = useFetcher<MetadataAssetSubmitResult>();
  const effectiveResult = fetcher.data ?? submitResult;
  const busy = fetcher.state !== "idle";

  if (aiAccessRequest.status === "invalid") {
    return (
      <div className="space-y-4">
        <AiFallbackPanel query={aiAccessRequest.query} types={["Dataset"]} />
        <p className="text-sm text-muted-foreground" role="alert">
          {aiAccessRequest.reason}
        </p>
      </div>
    );
  }

  const requestRole = aiAccessRequest.request.role ?? "analyst";
  const canRequest = policyDecision.allow || policyDecision.need_approval;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI-assisted access request</CardTitle>
        <CardDescription>
          Validated by Zod before render. Human confirmation is required before
          submit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SubmitResultBanner result={effectiveResult} />

        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            {aiAccessRequest.rationale}
          </p>
          <GenUiRenderer document={aiAccessRequest.genUiDocument} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            purpose: {aiAccessRequest.request.purpose}
          </Badge>
          <Badge variant="outline">role: {requestRole}</Badge>
        </div>

        {!showConfirm ? (
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
                Review AI request
              </Link>
            </Button>
          ) : (
            <Button type="button" disabled>
              Review AI request
            </Button>
          )
        ) : (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm font-medium">
              Review AI-generated request before submit (HITL)
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
              <div className="flex flex-wrap gap-4">
                <FormField
                  id="ai-request-purpose"
                  label="Purpose"
                  aiFilled
                  aiBadgeLabel="AI suggested"
                  className="w-40"
                >
                  <select
                    id="ai-request-purpose"
                    name="purpose"
                    defaultValue={aiAccessRequest.request.purpose}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="analytics">analytics</option>
                    <option value="marketing">marketing</option>
                    <option value="operations">operations</option>
                  </select>
                </FormField>
                <FormField
                  id="ai-request-role"
                  label="Role"
                  aiFilled
                  aiBadgeLabel="AI suggested"
                  className="w-40"
                >
                  <select
                    id="ai-request-role"
                    name="role"
                    defaultValue={requestRole}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="analyst">analyst</option>
                    <option value="engineer">engineer</option>
                    <option value="data_admin">data_admin</option>
                  </select>
                </FormField>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? "Submitting…" : "Confirm AI request"}
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
                    Cancel
                  </Link>
                </Button>
              </div>
            </fetcher.Form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DataContractCard({ asset }: { asset: MetadataAssetDetailContract }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data contract</CardTitle>
        <CardDescription>
          Owner, classification, PII fields, and terms of use
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
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
                <li key={col.name} className="flex flex-wrap gap-2">
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
      </CardContent>
    </Card>
  );
}

function AccessPolicyCard({
  policyDecision,
}: {
  policyDecision: PolicyDecisionContract;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Access policy</CardTitle>
        <CardDescription>
          Policy-driven evaluation (OPA Rego / in-process fallback)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>{humanPolicySummary(policyDecision)}</p>
        {policyDecision.require_audit ? (
          <p className="text-muted-foreground">
            Accessing this asset is recorded in the audit log.
          </p>
        ) : null}

        <details
          open
          className={cn(
            "rounded-lg border border-border p-3",
            "[&_summary]:cursor-pointer [&_summary]:select-none"
          )}
          data-testid="policy-debug-drawer"
        >
          <summary className="text-sm font-medium text-muted-foreground">
            Technical decision details
          </summary>
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
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
            <p className="text-xs text-muted-foreground">
              decision_id: {policyDecision.decision_id}
            </p>
            {policyDecision.mask_fields.length > 0 ? (
              <p className="text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}

function AssetLineageLists({ asset }: { asset: MetadataAssetDetailContract }) {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div>
        <h3 className="mb-2 font-medium">Upstream</h3>
        <ul className="space-y-1 text-muted-foreground">
          {asset.upstreamIds.map((id) => (
            <li key={id}>
              <Link
                to={`/metadata/${id}`}
                className="text-primary hover:underline"
              >
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
              <Link
                to={`/metadata/${id}`}
                className="text-primary hover:underline"
              >
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
  return (
    <Card data-testid="existing-application-card">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">Your application</CardTitle>
        <CardDescription>
          {application.purpose} · {application.role} · submitted{" "}
          {new Date(application.createdAt).toLocaleDateString()}
        </CardDescription>
        <AccessRequestLifecycleStepper status={application.status} />
      </CardHeader>
      <CardContent>
        <Link
          to={myApisHighlightHref(application.id)}
          className="text-sm text-primary hover:underline"
        >
          View in My APIs →
        </Link>
      </CardContent>
    </Card>
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
      <nav className="text-sm text-muted-foreground">
        <Link to="/metadata" className="hover:text-foreground hover:underline">
          Metadata catalog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{asset.name}</span>
      </nav>

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
    </div>
  );
}
