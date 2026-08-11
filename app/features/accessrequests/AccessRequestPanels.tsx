import { Form, Link, useFetcher, useNavigation } from "@remix-run/react";

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
  AccessRequestLifecycleStatus,
  GovernanceSessionRole,
} from "~/shared/contracts";
import { myApisHighlightHref } from "~/shared/navigation";
import { cn } from "~/shared/utils/cn";

export { myApisHighlightHref };

const STATUS_OK_CLASS = "text-sm text-green-700";
const STATUS_ERROR_CLASS = "text-sm text-destructive";

function StatusMessage({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={ok ? STATUS_OK_CLASS : STATUS_ERROR_CLASS} role="status">
      {text}
    </p>
  );
}

export function SessionRoleSwitcher({
  sessionRole,
}: {
  sessionRole: GovernanceSessionRole;
}) {
  const roles: GovernanceSessionRole[] = ["requester", "owner", "admin"];
  return (
    <div
      className="flex flex-wrap items-center gap-2 text-sm"
      role="group"
      aria-label="Session role"
    >
      <span className="text-muted-foreground">Session:</span>
      {roles.map((role) => (
        <Button
          key={role}
          asChild
          size="sm"
          variant={sessionRole === role ? "default" : "outline"}
        >
          <Link to={`?sessionRole=${role}`}>{role}</Link>
        </Button>
      ))}
    </div>
  );
}

/** Card skeleton — mirrors ProductResultsShell's animate-pulse convention. */
function ApplicationCardSkeleton() {
  return (
    <div
      className="animate-pulse space-y-3 rounded-2xl border border-border bg-card p-6"
      aria-hidden="true"
    >
      <div className="h-4 w-2/3 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="flex gap-2">
        <div className="h-6 w-20 rounded-full bg-muted" />
        <div className="h-6 w-24 rounded-full bg-muted" />
      </div>
    </div>
  );
}

function ApplicationCardSkeletonGrid({ rows = 2 }: { rows?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      role="status"
      aria-label="Loading applications"
    >
      {Array.from({ length: rows }, (_, index) => (
        <ApplicationCardSkeleton key={index} />
      ))}
    </div>
  );
}

type SubmitDraftFetcherData = { ok: boolean; text: string };
type CancelFetcherData =
  { data: AccessApplicationContract } | { error: string; code?: string };

function isCancelSuccess(
  data: CancelFetcherData | undefined
): data is { data: AccessApplicationContract } {
  return !!data && "data" in data;
}

function MyApisApplicationCard({
  app,
  highlighted,
}: {
  app: AccessApplicationContract;
  highlighted?: boolean;
}) {
  const draftFetcher = useFetcher<SubmitDraftFetcherData>();
  const cancelFetcher = useFetcher<CancelFetcherData>();
  const busy = draftFetcher.state !== "idle" || cancelFetcher.state !== "idle";

  const canSubmitDraft = app.status === "draft";
  const canCancel = app.status === "draft" || app.status === "pending_approval";

  const cancelResult = cancelFetcher.data;
  const cancelMessage = cancelResult
    ? isCancelSuccess(cancelResult)
      ? `Cancelled — status: ${cancelResult.data.status}`
      : cancelResult.error
    : null;

  return (
    <Card
      className={cn(
        highlighted &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      data-testid="my-apis-application-card"
      data-status={app.status}
    >
      <CardHeader className="space-y-2">
        {highlighted ? (
          <Badge variant="default" className="w-fit">
            Just updated
          </Badge>
        ) : null}
        <CardTitle className="text-base">
          <Link to={`/metadata/${app.assetId}`} className="hover:underline">
            {app.assetName}
          </Link>
        </CardTitle>
        <CardDescription>
          {app.purpose} · {app.role}
        </CardDescription>
        <AccessRequestLifecycleStepper status={app.status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">status: {app.status}</Badge>
          <Badge
            variant={
              app.permissionStatus === "granted" ? "default" : "secondary"
            }
          >
            permission: {app.permissionStatus}
          </Badge>
        </div>

        {cancelMessage ? (
          <StatusMessage
            ok={isCancelSuccess(cancelResult)}
            text={cancelMessage}
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {canSubmitDraft ? (
            <draftFetcher.Form method="post">
              <input type="hidden" name="intent" value="submit-draft" />
              <input type="hidden" name="requestId" value={app.id} />
              <Button type="submit" size="sm" disabled={busy}>
                {draftFetcher.state !== "idle"
                  ? "Submitting…"
                  : "Submit for approval"}
              </Button>
            </draftFetcher.Form>
          ) : null}
          {canCancel ? (
            <cancelFetcher.Form
              method="post"
              action={`/api/metadata/access-requests/${encodeURIComponent(app.id)}/cancel`}
            >
              <Button type="submit" size="sm" variant="outline" disabled={busy}>
                {cancelFetcher.state !== "idle" ? "Cancelling…" : "Cancel"}
              </Button>
            </cancelFetcher.Form>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function MyApisPanel({
  applications,
  sessionRole,
  loading = false,
  actionMessage,
  highlightId,
}: {
  applications: AccessApplicationContract[];
  sessionRole: GovernanceSessionRole;
  loading?: boolean;
  actionMessage?: { ok: boolean; text: string };
  highlightId?: string;
}) {
  return (
    <div className="space-y-6" data-surface="product">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            My APIs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Requester applications and permission status (G1 mock).
          </p>
        </div>
        <SessionRoleSwitcher sessionRole={sessionRole} />
      </div>

      {actionMessage ? <StatusMessage {...actionMessage} /> : null}

      {sessionRole !== "requester" ? (
        <p className="text-sm text-muted-foreground" role="status">
          Switch to requester to track applications.{" "}
          <Link
            to="/access-requests/review?sessionRole=owner"
            className="text-primary hover:underline"
          >
            Review queue
          </Link>
        </p>
      ) : null}

      {sessionRole === "requester" && applications.length > 0 && !loading ? (
        <Form method="post">
          <input type="hidden" name="intent" value="expire-stale" />
          <Button type="submit" size="sm" variant="outline">
            Expire stale (demo)
          </Button>
        </Form>
      ) : null}

      {loading ? (
        <ApplicationCardSkeletonGrid />
      ) : applications.length === 0 ? (
        <Card>
          <CardContent
            className="space-y-2 py-10 text-center text-sm text-muted-foreground"
            data-testid="my-apis-empty-state"
          >
            <p className="font-medium text-foreground">No applications yet</p>
            <p>
              Requester applications will appear here once you request access
              from a metadata asset.
            </p>
            <Link
              to="/metadata/tbl-customers"
              className="inline-block text-primary hover:underline"
            >
              Request access from a metadata asset →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {applications.map((app) => (
            <li key={app.id}>
              <MyApisApplicationCard
                app={app}
                highlighted={highlightId === app.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type ReviewActionData = {
  ok: boolean;
  text: string;
  requestId?: string;
  status?: AccessRequestLifecycleStatus;
};

function AccessReviewRequestCard({
  app,
  canReview,
}: {
  app: AccessApplicationContract;
  canReview: boolean;
}) {
  const fetcher = useFetcher<ReviewActionData>();
  const busy = fetcher.state !== "idle";
  const result = fetcher.data;
  const approvedRequestId =
    result?.ok && result.status === "approved"
      ? (result.requestId ?? app.id)
      : null;

  return (
    <Card data-testid="access-review-card" data-status={app.status}>
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">{app.assetName}</CardTitle>
        <CardDescription>
          {app.requesterId} · {app.purpose} · {app.role}
        </CardDescription>
        <AccessRequestLifecycleStepper status={app.status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{app.status}</Badge>
        </div>

        {result ? (
          <div className="space-y-1">
            <StatusMessage ok={result.ok} text={result.text} />
            {approvedRequestId ? (
              <p className="text-sm">
                <Link
                  to={myApisHighlightHref(approvedRequestId)}
                  className="text-primary hover:underline"
                >
                  View in My APIs (requester view) →
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        {canReview ? (
          <div className="flex flex-wrap items-center gap-3">
            <fetcher.Form method="post" className="inline">
              <input type="hidden" name="requestId" value={app.id} />
              <input type="hidden" name="decision" value="approved" />
              <Button type="submit" size="sm" disabled={busy}>
                Approve
              </Button>
            </fetcher.Form>
            <fetcher.Form method="post" className="inline">
              <input type="hidden" name="requestId" value={app.id} />
              <input type="hidden" name="decision" value="denied" />
              <Button type="submit" size="sm" variant="outline" disabled={busy}>
                Reject
              </Button>
            </fetcher.Form>
            <fetcher.Form
              method="post"
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="requestId" value={app.id} />
              <input type="hidden" name="decision" value="edited" />
              <select
                name="purpose"
                defaultValue={app.purpose}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                aria-label="Edit purpose"
              >
                <option value="analytics">analytics</option>
                <option value="marketing">marketing</option>
                <option value="operations">operations</option>
              </select>
              <select
                name="role"
                defaultValue={app.role}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                aria-label="Edit role"
              >
                <option value="analyst">analyst</option>
                <option value="engineer">engineer</option>
                <option value="data_admin">data_admin</option>
              </select>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={busy}
              >
                Edit
              </Button>
            </fetcher.Form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AccessRequestReviewPanel({
  pending,
  sessionRole,
  actionMessage,
  loading = false,
}: {
  pending: AccessApplicationContract[];
  sessionRole: GovernanceSessionRole;
  actionMessage?: { ok: boolean; text: string };
  loading?: boolean;
}) {
  const canReview = sessionRole === "owner" || sessionRole === "admin";
  const navigation = useNavigation();
  const busy = loading || navigation.state !== "idle";

  return (
    <div className="space-y-6" data-surface="product">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Access review
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Owner/admin pending queue — approve or deny (mock).
          </p>
        </div>
        <SessionRoleSwitcher sessionRole={sessionRole} />
      </div>

      {actionMessage ? <StatusMessage {...actionMessage} /> : null}

      {!canReview ? (
        <p className="text-sm text-muted-foreground" role="status">
          Switch to owner or admin to review.{" "}
          <Link
            to="/my-apis?sessionRole=requester"
            className="text-primary hover:underline"
          >
            My APIs
          </Link>
        </p>
      ) : null}

      {busy ? (
        <ApplicationCardSkeletonGrid rows={1} />
      ) : pending.length === 0 ? (
        <Card>
          <CardContent
            className="space-y-2 py-10 text-center text-sm text-muted-foreground"
            data-testid="access-review-empty-state"
          >
            <p className="font-medium text-foreground">No pending approvals</p>
            <p>New requests that require human review will show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {pending.map((app) => (
            <li key={app.id}>
              <AccessReviewRequestCard app={app} canReview={canReview} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
