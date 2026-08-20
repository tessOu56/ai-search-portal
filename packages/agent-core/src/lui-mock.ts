/**
 * Mock / fixture LUI 回應 — 當有 local RAG hits 時，sources／答案引用領域知識 chunk。
 * 導覽 CTA（Continue in catalog / Browse metadata）由 UI ContinueFacets 專責，
 * 不塞進 sources。無命中時走 query-aware golden fixture（合成資料，非真實 PII）。
 */

import {
  buildKnowledgeSourceUrl,
  buildMetadataFacetUrl,
} from "./knowledge-links.js";
import type { LocalDoc } from "./rag/local-store.js";

export type LuiSource = {
  title: string;
  url: string;
  /** Origin citation for grounded hits, e.g. glossary terms (T-2026-071). */
  source?: string;
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

type FixtureTopic = "pii" | "lineage" | "orders" | "generic";

function detectTopic(query: string): FixtureTopic {
  const q = query.toLowerCase();
  if (/pii|個資|敏感|權限|access|分類/.test(q)) return "pii";
  if (/lineage|血緣|upstream|customer_profile|譜系/.test(q)) return "lineage";
  if (/order|訂單|api/.test(q)) return "orders";
  return "generic";
}

function uniqueByUrl(sources: LuiSource[]): LuiSource[] {
  return sources.filter(
    (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i
  );
}

function buildQueryAwareFixture(query: string, packId: string): LuiResponse {
  const topic = detectTopic(query);

  if (topic === "pii") {
    return {
      summary: "示範 · 含 PII 標籤的資產需 owner 核准後才能分析。",
      answer: [
        "依合成目錄，含 PII 標籤的示範資產包括 customer_profile（tbl-customers）",
        "與相關 marketing 用途資料表。分析師角色通常需要 owner 核准；這不是真實授權",
        "——請用 Access request 流程（Demo role switcher）體驗 HITL，再從下方按鈕",
        "進入 metadata 詳情。",
      ].join(""),
      confidence: 0.86,
      sources: uniqueByUrl([
        {
          title: "customer_profile（示範資產）",
          url: [
            "/metadata/",
            encodeURIComponent("tbl-customers"),
            "?pack=",
            encodeURIComponent(packId),
          ].join(""),
        },
      ]),
      nextSteps: [
        "在 metadata 開啟 tbl-customers 查看 classification／terms",
        "以 requester 送出 access request（合成流程）",
        "用 ?sessionRole=owner 體驗審核（Demo only — not authentication）",
      ],
    };
  }

  if (topic === "lineage") {
    return {
      summary: "示範 · customer_profile 的上游血緣可在 metadata 詳情檢視。",
      answer: [
        "依合成 metadata pack，customer_profile（tbl-customers）的上游通常來自",
        " analytics 與相關同意／訂單表。請從下方來源進入 metadata 詳情看 Lineage DAG；",
        "若出現環則會顯示警告。此為 showcase 合成資料。",
      ].join(""),
      confidence: 0.84,
      sources: uniqueByUrl([
        {
          title: "customer_profile lineage（示範）",
          url: buildMetadataFacetUrl({
            q: "customer_profile",
            pack: packId,
            intent: "manual",
          }),
        },
      ]),
      nextSteps: [
        "開啟 metadata 詳情檢視 lineage",
        "用 catalog 搜尋同名維度／API",
        "需要權限時走 access-request 示範路徑",
      ],
    };
  }

  if (topic === "orders") {
    return {
      summary: "示範 · orders 相關 API 與資料集可對照 catalog 與 metadata。",
      answer: [
        "依合成目錄，orders 相關資產涵蓋訂單 API、事實表與金流狀態欄位。",
        "建議先用 catalog 篩選 API／Dictionary，再從 metadata 對照契約欄位。",
      ].join(""),
      confidence: 0.82,
      sources: uniqueByUrl([
        {
          title: "Orders metadata（示範）",
          url: buildMetadataFacetUrl({
            q: "orders",
            pack: packId,
            intent: "manual",
          }),
        },
      ]),
      nextSteps: [
        "在 catalog 以 orders 篩選 API",
        "在 metadata 對照表／欄位",
        "需要授權時走我的申請／access request（demo）",
      ],
    };
  }

  return {
    summary: `示範 · 尚無直接命中，建議從目錄與 metadata 交叉驗證「${query}」。`,
    answer: [
      "目前知識庫沒有直接命中。建議先釐清範圍，再從 catalog 與 metadata 交叉驗證；",
      "下方按鈕可帶你進入搜尋。此為 public showcase——回覆為合成 fixture，",
      "不是企業級授權答案。",
    ].join(""),
    confidence: 0.72,
    sources: [],
    nextSteps: [
      "補充你目前的情境限制或目標",
      "用下方按鈕開啟 catalog／metadata",
      "把答案轉成可執行任務清單",
    ],
  };
}

function buildGroundedLuiResponse(
  query: string,
  hits: LocalDoc[],
  packId: string
): LuiResponse {
  const top = hits[0];
  const extraTitles = hits
    .slice(1)
    .map((h) => h.title ?? h.id)
    .join("、");
  const groundedAnswer = [
    `依領域知識（${top.kind ?? "doc"}），關於「${query}」：`,
    top.text,
    hits.length > 1 ? `另可參考：${extraTitles}。` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const sources = uniqueByUrl(
    hits.map((hit) => ({
      title: hit.title ?? hit.id,
      url: buildKnowledgeSourceUrl(hit, packId),
      source: hit.source,
    }))
  );

  const standard = top.facets?.standards?.[0];
  const material = top.facets?.materials?.[0];
  const productType = top.facets?.productTypes?.[0];
  const auctionEligible = top.facets?.auctionEligible === true;
  let nextStep = "開啟來源連結核對 glossary／敘事細節";
  if (productType) {
    nextStep = `在 catalog 以產品類型 ${productType} 繼續篩選`;
  } else if (auctionEligible) {
    nextStep = "在 catalog 篩選可拍賣／孤品知識與作品";
  } else if (standard) {
    nextStep = `在 catalog 以印記 ${standard} 繼續篩選相關知識與資產`;
  } else if (material) {
    nextStep = `在 catalog 以材質 ${material} 繼續篩選`;
  }

  return {
    summary: `已依知識庫找到 ${hits.length} 筆與「${query}」相關的依據。`,
    answer: groundedAnswer,
    confidence: Math.min(0.92, 0.7 + hits.length * 0.05),
    sources,
    nextSteps: [
      nextStep,
      "需要實體商品／工作室時，從來源進入 metadata 或 Plinth Discover",
      "若涉及權限或拍賣狀態，對照 ops 狀態機 stub",
    ],
  };
}

export function buildLuiResponse(
  query: string,
  options: BuildLuiOptions = {}
): LuiResponse {
  const hits = options.ragHits ?? [];
  const packId = options.packId ?? "metalcraft-studio";
  if (hits.length > 0) {
    return buildGroundedLuiResponse(query, hits, packId);
  }
  return buildQueryAwareFixture(query, packId);
}

export function splitToTokens(text: string) {
  return text.split(" ");
}
