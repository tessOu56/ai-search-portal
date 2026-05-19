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

export function SaaSDemoView() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/60 backdrop-blur-sm">
        <Container className="flex items-center justify-between py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full text-xs">
                SaaS Demo
              </Badge>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Untitled style
              </span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Workspace overview
            </h1>
            <p className="text-sm text-muted-foreground">
              Example dashboard layout using the same primitives with a
              different theme.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Invite teammate
            </Button>
            <Button size="sm">New project</Button>
          </div>
        </Container>
      </div>

      <div className="flex">
        <aside className="hidden w-64 border-r border-border bg-card/80 px-4 py-6 text-sm text-muted-foreground md:block">
          <nav className="space-y-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                Main
              </p>
              <ul className="space-y-1">
                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg bg-primary/5 text-foreground hover:bg-primary/10"
                  >
                    Overview
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    Activity
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    Projects
                  </Button>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                Data
              </p>
              <ul className="space-y-1">
                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    Recipes
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-lg"
                  >
                    Vendors
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
              </ul>
            </div>
          </nav>
        </aside>

        <main className="flex-1">
          <Container className="py-8">
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    AI queries today
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Total questions handled across all workspaces
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-foreground">128</p>
                  <p className="mt-1 text-xs text-emerald-600">
                    +18% vs last 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Recipes indexed
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Structured items available for search
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-foreground">
                    3,245
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Including seasonal and vendor-specific variants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Connected vendors
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Live price feeds configured
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-foreground">12</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Real-time updates every 15 minutes
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Recent workspaces</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Demo table, no real data
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="grid grid-cols-4 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                    <span>Name</span>
                    <span>Type</span>
                    <span>Last activity</span>
                    <span className="text-right">Status</span>
                  </div>
                  <div className="divide-y divide-border text-sm">
                    <DemoRow
                      name="Recipe search"
                      type="2B query"
                      activity="5 min ago"
                      status="Live"
                    />
                    <DemoRow
                      name="Personal cookbook"
                      type="2C maintenance"
                      activity="32 min ago"
                      status="In setup"
                    />
                    <DemoRow
                      name="Vendor price monitor"
                      type="2B pricing"
                      activity="2 hours ago"
                      status="Live"
                    />
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

type DemoRowProps = {
  name: string;
  type: string;
  activity: string;
  status: string;
};

function DemoRow({ name, type, activity, status }: DemoRowProps) {
  return (
    <div className="grid grid-cols-4 items-center px-4 py-3">
      <span className="font-medium text-foreground">{name}</span>
      <span className="text-muted-foreground">{type}</span>
      <span className="text-muted-foreground">{activity}</span>
      <div className="flex justify-end">
        <Badge
          variant={status === "Live" ? "default" : "secondary"}
          className="rounded-full px-3 py-0.5 text-xs"
        >
          {status}
        </Badge>
      </div>
    </div>
  );
}
