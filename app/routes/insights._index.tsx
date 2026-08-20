import type { MetaFunction } from "@remix-run/node";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";

import {
  ProductPageHeader,
  ProductPageShell,
} from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { InsightsPanel } from "~/features/insights";
import { useI18n } from "~/shared/i18n/context";

export const meta: MetaFunction = () => [
  { title: "Insights (demo) | Portal" },
  {
    name: "description",
    content: "以圖表檢視 catalog 與搜尋資料（POC）",
  },
];

export default function InsightsIndexRoute() {
  const { t } = useI18n();
  return (
    <ProductPageShell current={t("nav.insights")}>
      <ProductPageHeader
        title={t("nav.insights")}
        description="資料視覺化 POC — 可切換圖表類型檢視 catalog 分布與搜尋趨勢。"
      />
      <InsightsPanel />
    </ProductPageShell>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Insights failed to render";

  return (
    <ProductPageShell current="Insights">
      <ProductPageHeader
        title="Insights"
        description="Chart surface hit an error; reload or switch chart type."
      />
      <p className="text-type-14 text-muted-foreground" role="alert">
        {message}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-space-16">
        <a href="/insights">Reload insights</a>
      </Button>
    </ProductPageShell>
  );
}
