import { Form, Link } from "@remix-run/react";

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
  GovernanceSessionRole,
} from "~/shared/contracts";

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

export function MyApisPanel({
  applications,
  sessionRole,
}: {
  applications: AccessApplicationContract[];
  sessionRole: GovernanceSessionRole;
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

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No applications yet.{" "}
            <Link
              to="/metadata/tbl-customers"
              className="text-primary hover:underline"
            >
              Request access from a metadata asset
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {applications.map((app) => (
            <li key={app.id}>
              <Card>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-base">
                    <Link
                      to={`/metadata/${app.assetId}`}
                      className="hover:underline"
                    >
                      {app.assetName}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {app.purpose} · {app.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge variant="outline">status: {app.status}</Badge>
                  <Badge
                    variant={
                      app.permissionStatus === "granted"
                        ? "default"
                        : "secondary"
                    }
                  >
                    permission: {app.permissionStatus}
                  </Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AccessRequestReviewPanel({
  pending,
  sessionRole,
  actionMessage,
}: {
  pending: AccessApplicationContract[];
  sessionRole: GovernanceSessionRole;
  actionMessage?: { ok: boolean; text: string };
}) {
  const canReview = sessionRole === "owner" || sessionRole === "admin";

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

      {actionMessage ? (
        <p
          className={
            actionMessage.ok
              ? "text-sm text-green-700"
              : "text-sm text-destructive"
          }
          role="status"
        >
          {actionMessage.text}
        </p>
      ) : null}

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

      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No pending approvals.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {pending.map((app) => (
            <li key={app.id}>
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">{app.assetName}</CardTitle>
                  <CardDescription>
                    {app.requesterId} · {app.purpose} · {app.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">{app.status}</Badge>
                  {canReview ? (
                    <>
                      <Form method="post" className="inline">
                        <input type="hidden" name="requestId" value={app.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <Button type="submit" size="sm">
                          Approve
                        </Button>
                      </Form>
                      <Form method="post" className="inline">
                        <input type="hidden" name="requestId" value={app.id} />
                        <input type="hidden" name="decision" value="denied" />
                        <Button type="submit" size="sm" variant="outline">
                          Deny
                        </Button>
                      </Form>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
