import { Form, Link, useFetcher, useNavigation } from "@remix-run/react";

import { AccessRequestLifecycleStepper } from "~/components/shared/governance";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Callout } from "~/components/ui/Callout";
import { EmptyState } from "~/components/ui/EmptyState";
import { Panel } from "~/components/ui/Panel";
import { SegmentedNav, SegmentedNavItem } from "~/components/ui/SegmentedNav";
import { Select } from "~/components/ui/Select";
import { Skeleton } from "~/components/ui/Skeleton";
import { PRODUCT_TABLE_LINK_CLASS } from "~/lib/experience-nav";
import { apiMetadataAccessRequestCancel } from "~/shared/api/paths";
import type {
  AccessApplicationContract,
  AccessRequestLifecycleStatus,
  GovernanceSessionRole,
} from "~/shared/contracts";
import { useI18n } from "~/shared/i18n/context";
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
      className="grid gap-stack-dense"
      role="group"
      aria-label="Demo session role"
    >
      <Callout tone="info">
        Demo persona via{" "}
        <code className="rounded bg-muted px-space-4">?sessionRole=</code>— not
        a login. This is a showcase, not production RBAC.
      </Callout>
      <div className="flex flex-wrap items-center gap-space-8">
        <span className="text-sm text-muted-foreground">Demo session:</span>
        <SegmentedNav aria-label="Demo session role">
          {roles.map((role) => (
            <SegmentedNavItem
              key={role}
              asChild
              current={sessionRole === role}
              className="min-w-0 px-stack-dense capitalize sm:min-w-28"
            >
              <Link to={`?sessionRole=${role}`}>{role}</Link>
            </SegmentedNavItem>
          ))}
        </SegmentedNav>
      </div>
    </div>
  );
}

function ApplicationCardSkeleton() {
  return (
    <Panel className="space-y-stack-dense" aria-hidden="true">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-space-8">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </Panel>
  );
}

function ApplicationCardSkeletonGrid({ rows = 2 }: { rows?: number }) {
  return (
    <div
      className="grid gap-stack sm:grid-cols-2"
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
    <Panel
      className={cn(
        highlighted &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      data-testid="my-apis-application-card"
      data-status={app.status}
    >
      <div className="mb-space-8 space-y-space-8">
        {highlighted ? (
          <Badge variant="default" className="w-fit">
            Just updated
          </Badge>
        ) : null}
        <h2 className="text-type-16 font-semibold text-foreground">
          <Link to={`/metadata/${app.assetId}`} className="hover:underline">
            {app.assetName}
          </Link>
        </h2>
        <p className="text-type-14 text-muted-foreground">
          {app.purpose} · {app.role}
        </p>
        <AccessRequestLifecycleStepper status={app.status} />
      </div>
      <div className="space-y-stack-dense">
        <div className="flex flex-wrap items-center gap-space-8">
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

        <div className="flex flex-wrap items-center gap-space-8">
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
              action={apiMetadataAccessRequestCancel(app.id)}
            >
              <Button type="submit" size="sm" variant="outline" disabled={busy}>
                {cancelFetcher.state !== "idle" ? "Cancelling…" : "Cancel"}
              </Button>
            </cancelFetcher.Form>
          ) : null}
        </div>
      </div>
    </Panel>
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
  const { t } = useI18n();
  return (
    <div className="space-y-section-dense" data-surface="product">
      <div className="flex flex-wrap items-end justify-between gap-stack">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t("nav.my-requests")}
          </h1>
          <p className="mt-space-4 text-sm text-muted-foreground">
            Requester applications and permission status (G1 showcase —
            in-memory store; not production auth).
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
            className={PRODUCT_TABLE_LINK_CLASS}
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
        <div data-testid="my-apis-empty-state">
          <EmptyState
            title="No applications yet"
            description="Requester applications will appear here once you request access from a metadata asset."
            action={
              <Button asChild>
                <Link to="/metadata/tbl-customers">
                  Request access from a metadata asset
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-stack sm:grid-cols-2">
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
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <Panel data-testid="access-review-card" data-status={app.status}>
      <div className="mb-space-8 space-y-space-8">
        <h2 className="text-type-16 font-semibold text-foreground">
          {app.assetName}
        </h2>
        <p className="text-type-14 text-muted-foreground">
          {app.requesterId} · {app.purpose} · {app.role}
        </p>
        <AccessRequestLifecycleStepper status={app.status} />
      </div>
      <div className="space-y-stack-dense">
        <div className="flex flex-wrap items-center gap-space-8">
          <Badge variant="secondary">{app.status}</Badge>
        </div>

        {canReview ? (
          <div className="flex flex-wrap items-center gap-stack-dense">
            <Form method="post" className="inline">
              <input type="hidden" name="requestId" value={app.id} />
              <input type="hidden" name="decision" value="approved" />
              <Button type="submit" size="sm" disabled={busy}>
                Approve
              </Button>
            </Form>
            <Form method="post" className="inline">
              <input type="hidden" name="requestId" value={app.id} />
              <input type="hidden" name="decision" value="denied" />
              <Button type="submit" size="sm" variant="outline" disabled={busy}>
                Reject
              </Button>
            </Form>
            <Form
              method="post"
              className="flex flex-wrap items-center gap-space-8"
            >
              <input type="hidden" name="requestId" value={app.id} />
              <input type="hidden" name="decision" value="edited" />
              <Select
                name="purpose"
                defaultValue={app.purpose}
                aria-label="Edit purpose"
                options={[
                  { value: "analytics", label: "analytics" },
                  { value: "marketing", label: "marketing" },
                  { value: "operations", label: "operations" },
                ]}
              />
              <Select
                name="role"
                defaultValue={app.role}
                aria-label="Edit role"
                options={[
                  { value: "analyst", label: "analyst" },
                  { value: "engineer", label: "engineer" },
                  { value: "data_admin", label: "data_admin" },
                ]}
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={busy}
              >
                Edit
              </Button>
            </Form>
          </div>
        ) : null}
      </div>
    </Panel>
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
  actionMessage?: ReviewActionData;
  loading?: boolean;
}) {
  const { t } = useI18n();
  const canReview = sessionRole === "owner" || sessionRole === "admin";
  const navigation = useNavigation();
  const busy = loading || navigation.state !== "idle";
  const approvedRequestId =
    actionMessage?.ok && actionMessage.status === "approved"
      ? actionMessage.requestId
      : null;

  return (
    <div className="space-y-section-dense" data-surface="product">
      <div className="flex flex-wrap items-end justify-between gap-stack">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t("nav.access-review")}
          </h1>
          <p className="mt-space-4 text-sm text-muted-foreground">
            Owner/admin pending queue — approve or deny (showcase demo; not
            production RBAC).
          </p>
        </div>
        <SessionRoleSwitcher sessionRole={sessionRole} />
      </div>

      {actionMessage ? (
        <div className="space-y-space-4">
          <StatusMessage {...actionMessage} />
          {approvedRequestId ? (
            <p className="text-sm">
              <Link
                to={myApisHighlightHref(approvedRequestId)}
                className={PRODUCT_TABLE_LINK_CLASS}
              >
                {t("nav.my-requests.view")}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {!canReview ? (
        <p className="text-sm text-muted-foreground" role="status">
          Switch to owner or admin to review.{" "}
          <Link
            to="/my-apis?sessionRole=requester"
            className={PRODUCT_TABLE_LINK_CLASS}
          >
            {t("nav.my-requests")}
          </Link>
        </p>
      ) : null}

      {busy ? (
        <ApplicationCardSkeletonGrid rows={1} />
      ) : pending.length === 0 ? (
        <div data-testid="access-review-empty-state">
          <EmptyState
            title="No pending approvals"
            description="New requests that require human review will show up here."
          />
        </div>
      ) : (
        <ul className="space-y-stack">
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
