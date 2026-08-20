import type { MetaFunction } from "@remix-run/node";

import {
  ProductPageHeader,
  ProductPageShell,
} from "~/components/shared/product/ProductPageShell";
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
