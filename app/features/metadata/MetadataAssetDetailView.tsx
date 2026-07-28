import { Form, Link, useSearchParams } from "@remix-run/react";

import { AiFallbackPanel } from "~/components/shared/chat/AiFallbackPanel";
import { GenUiRenderer } from "~/components/shared/genui";
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
  GenUiDocumentContract,
  MetadataAssetDetailContract,
  PolicyDecisionContract,
} from "~/shared/contracts";

export type MetadataAssetDetailProps = {
  asset: MetadataAssetDetailContract;
  genUiDocument: GenUiDocumentContract;
  policyDecision: PolicyDecisionContract;
  role: string;
  purpose: string;
  aiAccessRequest: AiAccessRequestState;
  submitResult?: { ok: boolean; message: string };
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

function AccessRequestPanel({
  policyDecision,
  role,
  purpose,
  submitResult,
}: {
  policyDecision: PolicyDecisionContract;
  role: string;
  purpose: string;
  submitResult?: { ok: boolean; message: string };
}) {
  // URL-driven HITL step (not useState) so E2E / dual-path work without waiting on hydration.
  const [searchParams] = useSearchParams();
  const showConfirm = searchParams.get("confirm") === "1";
  const canRequest = policyDecision.allow || policyDecision.need_approval;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request access</CardTitle>
        <CardDescription>
          Role: {role} · Purpose: {purpose}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submitResult ? (
          <div className="space-y-2">
            <p
              className={
                submitResult.ok
                  ? "text-sm text-green-700"
                  : "text-sm text-destructive"
              }
              role="status"
            >
              {submitResult.message}
            </p>
            {submitResult.ok ? (
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
          </div>
        ) : null}

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
            <Form method="post" className="flex gap-2">
              <input type="hidden" name="intent" value="access-request" />
              <input type="hidden" name="purpose" value={purpose} />
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="approved" value="true" />
              <Button type="submit">Confirm</Button>
              <Button asChild variant="outline">
                <Link to={buildConfirmHref(purpose, role, false)}>Cancel</Link>
              </Button>
            </Form>
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
  submitResult?: { ok: boolean; message: string };
}) {
  const [searchParams] = useSearchParams();
  const showConfirm = searchParams.get("confirm") === "1";

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
        {submitResult ? (
          <p
            className={
              submitResult.ok
                ? "text-sm text-green-700"
                : "text-sm text-destructive"
            }
            role="status"
          >
            {submitResult.message}
          </p>
        ) : null}

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
            <Form method="post" className="flex gap-2">
              <input type="hidden" name="intent" value="access-request" />
              <input
                type="hidden"
                name="purpose"
                value={aiAccessRequest.request.purpose}
              />
              <input type="hidden" name="role" value={requestRole} />
              <input type="hidden" name="approved" value="true" />
              <Button type="submit">Confirm AI request</Button>
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
            </Form>
          </div>
        )}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data contract</CardTitle>
          <CardDescription>
            Owner, classification, PII fields, and terms of use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Owner:</span> {asset.owner}
          </p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access policy</CardTitle>
          <CardDescription>
            Policy-driven evaluation (OPA Rego / in-process fallback)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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
          <ul className="list-inside list-disc text-muted-foreground">
            {policyDecision.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

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
    </div>
  );
}
