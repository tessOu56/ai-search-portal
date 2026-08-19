import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClientOnly } from "remix-utils/client-only";

import { Button } from "~/components/ui/Button";
import { Panel } from "~/components/ui/Panel";
import { Skeleton } from "~/components/ui/Skeleton";
import { Stack } from "~/components/ui/Stack";
import { Toolbar } from "~/components/ui/Toolbar";

import {
  catalogDistribution,
  chartColors,
  type ChartType,
  type InsightDatum,
  searchTrend,
} from "./insights.mock";

const chartOptions: { type: ChartType; label: string }[] = [
  { type: "bar", label: "長條圖" },
  { type: "line", label: "折線圖" },
  { type: "pie", label: "圓餅圖" },
];

function InsightChart({
  type,
  data,
}: {
  type: ChartType;
  data: InsightDatum[];
}) {
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke={chartColors[0]}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={entry.label}
              fill={chartColors[index % chartColors.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

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
      <Toolbar>
        <div className="flex flex-wrap items-center gap-2">
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
        <h2 className="mb-3 text-type-16 font-semibold text-foreground">
          {heading}
        </h2>
        <ClientOnly
          fallback={<Skeleton className="h-[320px] w-full rounded-lg" />}
        >
          {() => <InsightChart type={chartType} data={data} />}
        </ClientOnly>
      </Panel>
    </Stack>
  );
}
