import { lazy, Suspense } from "react";
import type { MetaFunction } from "react-router";
import { isRouteErrorResponse, useRouteError } from "react-router";

import {
  ProductPageHeader,
  ProductPageShell,
} from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { Skeleton } from "~/components/ui/Skeleton";
import { useI18n } from "~/shared/i18n/context";

const InsightsPanel = lazy(async () => {
  const mod = await import("~/features/insights");
  return { default: mod.InsightsPanel };
});

function InsightsFallback() {
  const { t } = useI18n();
  return (
    <div role="status" className="space-y-space-16" aria-live="polite">
      <p className="text-type-14 text-muted-foreground">
        {t("insights.chart.loading")}
      </p>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const INSIGHTS_TITLE_KEY = "nav.insights";
const INSIGHTS_DESC_KEY = "insights.page.description";

export const meta: MetaFunction = () => [
  { title: "Insights (demo) | Portal" },
  {
    name: "description",
    content: "Chart view of catalog mix and search trend (demo).",
  },
];

export default function InsightsIndexRoute() {
  const { t } = useI18n();
  return (
    <ProductPageShell current={t(INSIGHTS_TITLE_KEY)}>
      <ProductPageHeader
        title={t(INSIGHTS_TITLE_KEY)}
        description={t(INSIGHTS_DESC_KEY)}
      />
      <Suspense fallback={<InsightsFallback />}>
        <InsightsPanel />
      </Suspense>
    </ProductPageShell>
  );
}

export function ErrorBoundary() {
  const { t } = useI18n();
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Insights failed to render";

  return (
    <ProductPageShell current={t(INSIGHTS_TITLE_KEY)}>
      <ProductPageHeader
        title={t(INSIGHTS_TITLE_KEY)}
        description={t(INSIGHTS_DESC_KEY)}
      />
      <p className="text-type-14 text-muted-foreground" role="alert">
        {message}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-space-16">
        <a href="/insights">{t("insights.error.retry")}</a>
      </Button>
    </ProductPageShell>
  );
}
