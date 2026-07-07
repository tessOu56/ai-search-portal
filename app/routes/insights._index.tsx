import type { MetaFunction } from "@remix-run/node";

import { Container } from "~/components/ui/Container";
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
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          資料視覺化 POC — 可切換圖表類型檢視 catalog 分布與搜尋趨勢。
        </p>
      </div>
      <InsightsPanel />
    </Container>
  );
}
