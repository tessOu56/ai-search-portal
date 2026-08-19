import { Link } from "@remix-run/react";
import type { ReactNode } from "react";

import { Container } from "~/components/ui/Container";
import { Stack } from "~/components/ui/Stack";

export type ProductCrumb = { to: string; label: string };

export function ProductPageShell({
  crumbs,
  current,
  children,
}: {
  crumbs?: ProductCrumb[];
  current: string;
  children: ReactNode;
}) {
  const trail = crumbs ?? [{ to: "/", label: "AI Search Portal" }];

  return (
    <div className="min-h-dvh bg-background">
      <Container className="px-space-16 py-space-32 md:px-space-32">
        <Stack gap="lg">
          <nav
            className="text-type-14 text-muted-foreground"
            aria-label="Breadcrumb"
          >
            {trail.map((crumb, index) => (
              <span key={`${crumb.to}:${crumb.label}`}>
                {index > 0 ? (
                  <span className="mx-2" aria-hidden>
                    /
                  </span>
                ) : null}
                <Link
                  to={crumb.to}
                  className="hover:text-foreground hover:underline"
                >
                  {crumb.label}
                </Link>
              </span>
            ))}
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-foreground">{current}</span>
          </nav>
          {children}
        </Stack>
      </Container>
    </div>
  );
}

export function ProductPageHeader({
  title,
  description,
  extra,
  actions,
}: {
  title: string;
  description?: ReactNode;
  extra?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="space-y-space-8">
      {extra}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-display text-type-32 font-medium tracking-tight text-foreground">
          {title}
        </h1>
        {actions}
      </div>
      {description ? (
        <div className="max-w-2xl text-type-16 text-muted-foreground">
          {description}
        </div>
      ) : null}
    </header>
  );
}
