import { Link } from "@remix-run/react";

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

/**
 * Dashboard 總覽（輔助路徑，interface-roadmap R1）。
 * 版面完整呈現、資料內容為空（尚未接資料來源）；主題與 chat 主流程共用（不另掛 theme）。
 */
export function DashboardView() {
  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/catalog-search">Catalog search</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/metadata">Metadata</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/vitals">Web Vitals</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/site-map">Site map</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/items/new">New item</Link>
            </Button>
          </div>
        </Container>
      </div>

      <div className="flex flex-col md:flex-row">
        <nav
          className="bg-card/80 flex gap-2 overflow-x-auto border-b border-border px-4 py-3 text-sm md:hidden"
          aria-label="Dashboard mobile"
        >
          <Button asChild variant="secondary" size="sm" className="shrink-0">
            <Link to="/?view=dashboard">Overview</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/catalog-search">Catalog</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/metadata">Metadata</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/insights">Insights</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="/site-map">Site map</Link>
          </Button>
        </nav>
        <aside className="bg-card/80 hidden w-64 shrink-0 border-r border-border px-4 py-6 text-sm text-muted-foreground md:block">
          <nav className="space-y-6">
            <div>
              <p className="text-muted-foreground/80 mb-2 text-xs font-semibold uppercase tracking-wide">
                Main
              </p>
              <ul className="space-y-1">
                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-primary/5 hover:bg-primary/10 w-full justify-start rounded-lg text-foreground"
                    aria-current="page"
                  >
                    Overview
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                    disabled
                    title="Coming soon"
                  >
                    Activity
                  </Button>
                </li>
                <li>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Link to="/insights">Insights</Link>
                  </Button>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-muted-foreground/80 mb-2 text-xs font-semibold uppercase tracking-wide">
                Data
              </p>
              <ul className="space-y-1">
                <li>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Link to="/dishes">Dishes</Link>
                  </Button>
                </li>
                <li>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Link to="/recipes">Recipes</Link>
                  </Button>
                </li>
                <li>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Link to="/items">Items</Link>
                  </Button>
                </li>
                <li>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Link to="/catalog-search">Catalog search</Link>
                  </Button>
                </li>
                <li>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    <Link to="/metadata">Metadata catalog</Link>
                  </Button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        <main className="flex-1">
          <Container className="py-8">
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
