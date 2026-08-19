import { Link, useNavigate } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "~/components/ui/Button";
import { Container } from "~/components/ui/Container";
import { Stack } from "~/components/ui/Stack";
import {
  backFallbackHref,
  canGoBackFromHistory,
  OVERVIEW_HOME,
} from "~/lib/workspace-mode";
import { useI18n } from "~/shared/i18n/context";

export type ProductCrumb = { to: string; label: string };

function normalizeCrumbs(
  crumbs: ProductCrumb[] | undefined,
  homeLabel: string
): ProductCrumb[] {
  const trail = crumbs ?? [{ to: OVERVIEW_HOME, label: homeLabel }];
  return trail.map((crumb, index) => {
    if (index === 0 && (crumb.to === "/" || crumb.to === "")) {
      return { ...crumb, to: OVERVIEW_HOME };
    }
    return crumb;
  });
}

export function ProductPageShell({
  crumbs,
  current,
  children,
}: {
  crumbs?: ProductCrumb[];
  current: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const trail = normalizeCrumbs(crumbs, t("app.title"));
  const fallback = backFallbackHref(trail);

  return (
    <div className="bg-background">
      <Container className="px-space-16 py-space-32 md:px-space-32">
        <Stack gap="lg">
          <nav
            className="flex flex-wrap items-center gap-2 text-type-14 text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2"
              onClick={() => {
                if (canGoBackFromHistory()) {
                  navigate(-1);
                  return;
                }
                navigate(fallback);
              }}
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t("nav.back")}
            </Button>
            {trail.map((crumb) => (
              <span key={`${crumb.to}:${crumb.label}`}>
                <span className="mx-2" aria-hidden>
                  /
                </span>
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
