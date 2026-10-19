import { lazy, Suspense, useEffect, useState } from "react";

import { Button } from "~/components/ui/Button";
import { Panel } from "~/components/ui/Panel";
import { Skeleton } from "~/components/ui/Skeleton";
import { Stack } from "~/components/ui/Stack";
import { Toolbar } from "~/components/ui/Toolbar";

import {
  catalogDistribution,
  type ChartType,
  type InsightDatum,
  searchTrend,
} from "./insights.mock";

const InsightChart = lazy(() =>
  import("./InsightChart").then((mod) => ({ default: mod.InsightChart }))
);

function ClientChart({
  type,
  data,
}: {
  type: ChartType;
  data: InsightDatum[];
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    return <Skeleton className="size-full rounded-lg" />;
  }
  return (
    <Suspense fallback={<Skeleton className="size-full rounded-lg" />}>
      <InsightChart type={type} data={data} />
    </Suspense>
  );
}

const chartOptions: { type: ChartType; label: string }[] = [
  { type: "bar", label: "長條圖" },
  { type: "line", label: "折線圖" },
  { type: "pie", label: "圓餅圖" },
];

/**
 * 資料視覺化面板（Phase 1 POC，mock 資料）。
 * 圖表類型可切換；Phase 2 將切換狀態收斂到 URL searchParam。
 */
export function InsightsPanel() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const data = chartType === "line" ? searchTrend : catalogDistribution;
  const heading =
    chartType === "line" ? "每月搜尋次數趨勢" : "Catalog 項目類型分布";

  return (
    <Stack gap="lg">
      <Toolbar appearance="plain" density="compact">
        <div className="flex flex-wrap items-center gap-space-8">
          {chartOptions.map((option) => (
            <Button
              key={option.type}
              size="sm"
              variant={chartType === option.type ? "default" : "outline"}
              onClick={() => setChartType(option.type)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </Toolbar>
      <Panel>
        <h2 className="mb-space-8 text-type-16 font-semibold text-foreground">
          {heading}
        </h2>
        <div className="h-[320px] w-full min-w-0" data-testid="insights-chart">
          <ClientChart type={chartType} data={data} />
        </div>
      </Panel>
    </Stack>
  );
}
