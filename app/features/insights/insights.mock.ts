export interface InsightDatum {
  label: string;
  value: number;
}

export type ChartType = "bar" | "line" | "pie";

/**
 * Phase 1 mock 聚合資料。
 * Phase 2 改由 loader 聚合 catalog 真實資料（見 docs/DATA-VIZ-PLAN.md）。
 */
export const catalogDistribution: InsightDatum[] = [
  { label: "Dishes", value: 42 },
  { label: "Recipes", value: 67 },
  { label: "Ingredients", value: 128 },
  { label: "Vendors", value: 23 },
  { label: "Metadata", value: 55 },
];

export const searchTrend: InsightDatum[] = [
  { label: "2026-01", value: 320 },
  { label: "2026-02", value: 410 },
  { label: "2026-03", value: 380 },
  { label: "2026-04", value: 520 },
  { label: "2026-05", value: 610 },
  { label: "2026-06", value: 690 },
];

export const chartColors = [
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#ef4444",
];
