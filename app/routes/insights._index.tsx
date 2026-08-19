import type { MetaFunction } from "@remix-run/node";

import {
  ProductPageHeader,
  ProductPageShell,
} from "~/components/shared/product/ProductPageShell";
import { InsightsPanel } from "~/features/insights";

export const meta: MetaFunction = () => [
  { title: "Insights | AI Search Portal" },
  {
    name: "description",
    content: "以圖表檢視 catalog 與搜尋資料（POC）",
  },
];

export default function InsightsIndexRoute() {
  return (
    <ProductPageShell current="Insights">
      <ProductPageHeader
        title="Insights"
        description="資料視覺化 POC — 可切換圖表類型檢視 catalog 分布與搜尋趨勢。"
      />
      <InsightsPanel />
    </ProductPageShell>
  );
}
