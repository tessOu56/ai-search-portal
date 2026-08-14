import { Link } from "@remix-run/react";

import { WorkspaceFooter } from "~/components/app/workspace/WorkspaceFooter";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
import { Container } from "~/components/ui/Container";
import { cn } from "~/shared/utils/cn";

const NAV_LINK =
  "block rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground";
const NAV_LINK_CURRENT =
  "block rounded-full bg-primary/5 px-4 py-2 text-sm text-foreground";

/**
 * Dashboard 總覽（輔助路徑，interface-roadmap R1）。
 * 版面完整呈現、資料內容為空（尚未接資料來源）；主題與 chat 主流程共用（不另掛 theme）。
 */
export function DashboardView() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-card/60 border-b border-border backdrop-blur-sm">
        <Container className="flex items-center justify-between py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full text-xs">
                Dashboard
              </Badge>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Overview
              </span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Workspace overview
            </h1>
            <p className="text-sm text-muted-foreground">
              AI search overview — data status, shortcuts, and product lines.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/items/new">New item</Link>
          </Button>
        </Container>
      </div>

      <div className="flex flex-col md:flex-row">
        <nav
          className="bg-card/80 flex gap-2 overflow-x-auto border-b border-border px-4 py-3 text-sm md:hidden"
          aria-label="Dashboard mobile"
        >
          <Link
            to="/?view=dashboard"
            className={cn(NAV_LINK_CURRENT, "shrink-0")}
          >
            Overview
          </Link>
          <Link to="/catalog-search" className={cn(NAV_LINK, "shrink-0")}>
            Catalog
          </Link>
          <Link to="/metadata" className={cn(NAV_LINK, "shrink-0")}>
            Metadata
          </Link>
          <Link to="/insights" className={cn(NAV_LINK, "shrink-0")}>
            Insights
          </Link>
          <Link to="/site-map" className={cn(NAV_LINK, "shrink-0")}>
            Site map
          </Link>
        </nav>
        <aside className="bg-card/80 hidden w-64 shrink-0 border-r border-border px-4 py-6 text-sm text-muted-foreground md:block">
          <nav className="space-y-6">
            <div>
              <p className="text-muted-foreground/80 mb-2 text-xs font-semibold uppercase tracking-wide">
                Main
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/?view=dashboard"
                    className={NAV_LINK_CURRENT}
                    aria-current="page"
                  >
                    Overview
                  </Link>
                </li>
                <li>
                  <span
                    className={cn(NAV_LINK, "cursor-not-allowed opacity-50")}
                    title="Coming soon"
                  >
                    Activity
                  </span>
                </li>
                <li>
                  <Link to="/insights" className={NAV_LINK}>
                    Insights
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-muted-foreground/80 mb-2 text-xs font-semibold uppercase tracking-wide">
                Data
              </p>
              <ul className="space-y-1">
                <li>
                  <Link to="/dishes" className={NAV_LINK}>
                    Dishes
                  </Link>
                </li>
                <li>
                  <Link to="/recipes" className={NAV_LINK}>
                    Recipes
                  </Link>
                </li>
                <li>
                  <Link to="/items" className={NAV_LINK}>
                    Items
                  </Link>
                </li>
                <li>
                  <Link to="/catalog-search" className={NAV_LINK}>
                    Catalog search
                  </Link>
                </li>
                <li>
                  <Link to="/metadata" className={NAV_LINK}>
                    Metadata catalog
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        <main className="flex-1">
          <Container className="py-8">
            <p className="mb-6 flex flex-wrap gap-x-space-16 gap-y-space-8 text-sm">
              <Link
                to="/catalog-search"
                className="text-primary hover:underline"
              >
                Catalog search
              </Link>
              <Link to="/metadata" className="text-primary hover:underline">
                Metadata
              </Link>
              <Link to="/vitals" className="text-primary hover:underline">
                Web Vitals
              </Link>
              <Link to="/site-map" className="text-primary hover:underline">
                Site map
              </Link>
            </p>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <MetricCard
                title="AI queries today"
                description="Total questions handled across all workspaces"
              />
              <MetricCard
                title="Recipes indexed"
                description="Structured items available for search"
              />
              <MetricCard
                title="Connected vendors"
                description="Live price feeds configured"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Recent workspaces</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    No data source connected
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <div className="grid min-w-[36rem] grid-cols-4 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                    <span>Name</span>
                    <span>Type</span>
                    <span>Last activity</span>
                    <span className="text-right">Status</span>
                  </div>
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <p>No workspaces yet.</p>
                    <p className="mt-1 text-xs">
                      Data will appear here once a source is connected.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Container>
        </main>
      </div>
      <WorkspaceFooter />
    </div>
  );
}

type MetricCardProps = {
  title: string;
  description: string;
};

function MetricCard({ title, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-muted-foreground">—</p>
        <p className="mt-1 text-xs text-muted-foreground">No data yet</p>
      </CardContent>
    </Card>
  );
}
