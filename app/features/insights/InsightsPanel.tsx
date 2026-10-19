import { useState } from "react";

import { Button } from "~/components/ui/Button";
import { Panel } from "~/components/ui/Panel";
import { Stack } from "~/components/ui/Stack";
import { Toolbar } from "~/components/ui/Toolbar";
import { useI18n } from "~/shared/i18n/context";

import { InsightChart } from "./InsightChart";
import {
  catalogDistribution,
  type ChartType,
  searchTrend,
} from "./insights.mock";

/**
 * 資料視覺化面板（Phase 1 POC，mock 資料）。
 * 圖表類型可切換；Phase 2 將切換狀態收斂到 URL searchParam。
 */
export function InsightsPanel() {
  const { t } = useI18n();
  const [chartType, setChartType] = useState<ChartType>("bar");
  const data = chartType === "line" ? searchTrend : catalogDistribution;
  const heading =
    chartType === "line"
      ? t("insights.heading.trend")
      : t("insights.heading.distribution");
  const chartOptions: { type: ChartType; labelKey: string }[] = [
    { type: "bar", labelKey: "insights.chart.bar" },
    { type: "line", labelKey: "insights.chart.line" },
    { type: "pie", labelKey: "insights.chart.pie" },
  ];

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
              {t(option.labelKey)}
            </Button>
          ))}
        </div>
      </Toolbar>
      <Panel>
        <h2 className="mb-space-8 text-type-16 font-semibold text-foreground">
          {heading}
        </h2>
        <div className="h-[320px] w-full min-w-0" data-testid="insights-chart">
          <InsightChart type={chartType} data={data} />
        </div>
      </Panel>
    </Stack>
  );
}
