/**
 * Mock / fixture LUI 回應 — 當有 local RAG hits 時，sources／答案引用領域知識 chunk，
 * 並附帶 catalog／metadata 分面 continue CTA。無命中時改走 query-aware golden fixture
 * （合成資料，非真實 PII），並強制 deep link 到 catalog／metadata。
 */

import {
  buildCatalogFacetUrl,
  buildKnowledgeContinueSources,
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

function syntheticBadgeSources(query: string, packId: string): LuiSource[] {
  return [
    {
      title: "Synthetic fixture — not real PII",
      url: buildMetadataFacetUrl({ q: query, pack: packId, intent: "manual" }),
    },
    {
      title: "Continue in catalog",
      url: buildCatalogFacetUrl({ q: query, intent: "manual" }),
    },
    {
      title: "Browse metadata catalog",
      url: buildMetadataFacetUrl({ q: query, pack: packId, intent: "manual" }),
    },
  ];
}

function buildQueryAwareFixture(query: string, packId: string): LuiResponse {
  const topic = detectTopic(query);
  const continueSources = buildKnowledgeContinueSources(
    query,
    undefined,
    packId
  );
  const synth = syntheticBadgeSources(query, packId);

  if (topic === "pii") {
    return {
      summary: "Synthetic fixture：PII／權限題。展示資料為假資料，非真實個資。",
      answer: [
        "依合成目錄，含 PII 標籤的示範資產包括 customer_profile（tbl-customers）",
        "與相關 marketing 用途資料表。分析師角色通常需要 owner 核准；這不是真實授權",
        "——請用 Access request 流程（Demo role switcher）體驗 HITL，再從 References",
        "進入 metadata 詳情。",
      ].join(""),
      confidence: 0.86,
      sources: [
        {
          title: "customer_profile (synthetic)",
          url: [
            "/metadata/",
            encodeURIComponent("tbl-customers"),
            "?pack=",
            encodeURIComponent(packId),
          ].join(""),
        },
        ...continueSources,
        ...synth,
      ].filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i),
      nextSteps: [
        "在 metadata 開啟 tbl-customers 查看 classification／terms",
        "以 requester 送出 access request（合成流程）",
        "用 ?sessionRole=owner 體驗審核（Demo only — not authentication）",
      ],
    };
  }

  if (topic === "lineage") {
    return {
      summary:
        "Synthetic fixture：customer_profile 上游血緣示範（非生產譜系）。",
      answer: [
        "依合成 metadata pack，customer_profile（tbl-customers）的上游通常來自",
        " analytics 與相關同意／訂單表。請從 References 進入 metadata 詳情看 Lineage DAG；",
        "若出現環則會顯示警告。此為 showcase 合成資料。",
      ].join(""),
      confidence: 0.84,
      sources: [
        {
          title: "customer_profile lineage (synthetic)",
          url: buildMetadataFacetUrl({
            q: "customer_profile",
            pack: packId,
            intent: "manual",
          }),
        },
        {
          title: "Continue in catalog",
          url: buildCatalogFacetUrl({
            q: "customer_profile",
            intent: "manual",
          }),
        },
        ...continueSources,
      ].filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i),
      nextSteps: [
        "開啟 metadata 詳情檢視 lineage",
        "用 catalog 搜尋同名維度／API",
        "需要權限時走 access-request 示範路徑",
      ],
    };
  }

  if (topic === "orders") {
    return {
      summary: "Synthetic fixture：orders 相關 API／資料集示範。",
      answer: [
        "依合成目錄，orders 相關資產涵蓋訂單 API、事實表與金流狀態欄位。",
        "建議先用 catalog 篩選 API／Dictionary，再從 metadata 對照契約欄位。",
        "References 已帶入 deep link。",
      ].join(""),
      confidence: 0.82,
      sources: [
        {
          title: "Orders in catalog",
          url: buildCatalogFacetUrl({ q: "orders", intent: "manual" }),
        },
        {
          title: "Orders in metadata",
          url: buildMetadataFacetUrl({
            q: "orders",
            pack: packId,
            intent: "manual",
          }),
        },
        ...continueSources,
      ].filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i),
      nextSteps: [
        "在 catalog 以 orders 篩選 API",
        "在 metadata 對照表／欄位",
        "需要授權時走我的申請／access request（demo）",
      ],
    };
  }

  return {
    summary: `已理解你的問題：「${query}」（Offline fixture／合成資料）。`,
    answer: [
      "目前知識庫沒有直接命中。建議先釐清範圍，再從 catalog 與 metadata 交叉驗證；",
      "下方 References 已帶入搜尋 deep link。此為 public showcase——回覆為合成 fixture，",
      "不是企業級授權答案。",
    ].join(""),
    confidence: 0.72,
    sources: [...continueSources, ...synth].filter(
      (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i
    ),
    nextSteps: [
      "補充你目前的情境限制或目標",
      "從 References 開啟 catalog／metadata",
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

  const hitSources: LuiSource[] = hits.map((hit) => ({
    title: hit.title ?? hit.id,
    url: buildKnowledgeSourceUrl(hit, packId),
    source: hit.source,
  }));
  const continueSources = buildKnowledgeContinueSources(query, top, packId);
  const sources = [...hitSources, ...continueSources].filter(
    (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i
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
    summary: `已依 ${packId} 知識庫檢索「${query}」，找到 ${hits.length} 筆相關依據。`,
    answer: groundedAnswer,
    confidence: Math.min(0.92, 0.7 + hits.length * 0.05),
    sources,
    nextSteps: [
      nextStep,
      "需要實體商品／工作室時，從來源 refs 進入 metadata 或 Plinth Discover",
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
