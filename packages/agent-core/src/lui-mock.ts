/**
 * Mock LUI 回應 — 當有 local RAG hits 時，sources／答案引用領域知識 chunk，
 * 並附帶 catalog／metadata 分面 continue CTA。
 */

import {
  buildKnowledgeContinueSources,
  buildKnowledgeSourceUrl,
} from "./knowledge-links.js";
import type { LocalDoc } from "./rag/local-store.js";

export type LuiSource = {
  title: string;
  url: string;
};

export type LuiResponse = {
  summary: string;
  answer: string;
  confidence: number;
  sources: LuiSource[];
  nextSteps: string[];
};

export type BuildLuiOptions = {
  ragHits?: LocalDoc[];
  packId?: string;
};

export function buildLuiResponse(
  query: string,
  options: BuildLuiOptions = {}
): LuiResponse {
  const hits = options.ragHits ?? [];
  const packId = options.packId ?? "metalcraft-studio";

  if (hits.length > 0) {
    const top = hits[0];
    const groundedAnswer = [
      `依領域知識（${top.kind ?? "doc"}），關於「${query}」：`,
      top.text,
      hits.length > 1
        ? `另可參考：${hits
            .slice(1)
            .map((h) => h.title ?? h.id)
            .join("、")}。`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    const hitSources: LuiSource[] = hits.map((hit) => ({
      title: hit.title ?? hit.id,
      url: buildKnowledgeSourceUrl(hit, packId),
    }));
    const continueSources = buildKnowledgeContinueSources(query, top, packId);
    const sources = [...hitSources, ...continueSources].filter(
      (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i
    );

    const standard = top.facets?.standards?.[0];
    const material = top.facets?.materials?.[0];
    const productType = top.facets?.productTypes?.[0];
    const auctionEligible = top.facets?.auctionEligible === true;

    return {
      summary: `已依 ${packId} 知識庫檢索「${query}」，找到 ${hits.length} 筆相關依據。`,
      answer: groundedAnswer,
      confidence: Math.min(0.92, 0.7 + hits.length * 0.05),
      sources,
      nextSteps: [
        productType
          ? `在 catalog 以產品類型 ${productType} 繼續篩選`
          : auctionEligible
            ? "在 catalog 篩選可拍賣／孤品知識與作品"
            : standard
              ? `在 catalog 以印記 ${standard} 繼續篩選相關知識與資產`
              : material
                ? `在 catalog 以材質 ${material} 繼續篩選`
                : "開啟來源連結核對 glossary／敘事細節",
        "需要實體商品／工作室時，從來源 refs 進入 metadata 或 Plinth Discover",
        "若涉及權限或拍賣狀態，對照 ops 狀態機 stub",
      ],
    };
  }

  return {
    summary: `已理解你的問題：「${query}」。我會先給你結論，再補上依據與下一步。`,
    answer:
      "建議先釐清需求範圍與限制條件，接著找出 2-3 個可信來源交叉驗證，最後整理成可執行的行動清單。這樣可以在資訊量龐大的情境下，依然快速做出正確判斷。",
    confidence: 0.78,
    sources: [
      {
        title: "Remix 官方文件",
        url: "https://remix.run/docs",
      },
      {
        title: "AI 搜尋最佳實務",
        url: "https://ai-search-portal.local/guide",
      },
      ...buildKnowledgeContinueSources(query, undefined, packId),
    ],
    nextSteps: [
      "補充你目前的情境限制或目標",
      "選擇一個來源作為主要依據",
      "把答案轉成可執行任務清單",
    ],
  };
}

export function splitToTokens(text: string) {
  return text.split(" ");
}
