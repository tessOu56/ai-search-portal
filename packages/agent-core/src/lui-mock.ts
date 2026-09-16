/**
 * Mock / fixture LUI 回應 — 當有 local RAG hits 時，sources／答案引用領域知識 chunk。
 * 導覽 CTA（Continue in catalog / Browse metadata）由 UI ContinueFacets 專責，
 * 不塞進 sources。無命中時走 query-aware golden fixture（合成資料，非真實 PII）。
 */

import {
  detectEcosystemTopic,
  type EcosystemTopic,
  NX_EVENT_PORTAL_LIVE,
  PLINTH_AUCTIONS_LIVE,
  PLINTH_LOT_LIVE,
  VUE_MOTION_LAB_LIVE,
} from "./ecosystem-live-links.js";
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

export type LuiNextAction = {
  label: string;
  href: string;
};

const NX_EVENTS_LIVE_ACTION: LuiNextAction = {
  label: "開啟 nx 活動目錄（LIVE）",
  href: NX_EVENT_PORTAL_LIVE,
};

export type LuiResponse = {
  summary: string;
  answer: string;
  confidence: number;
  sources: LuiSource[];
  nextSteps: string[];
  nextActions?: LuiNextAction[];
};

const DEFAULT_ASSET_ID = "tbl-customers";
const MY_REQUESTS_HREF = "/my-apis?sessionRole=requester";
const OWNER_REVIEW_HREF = "/access-requests/review?sessionRole=owner";

function assetRequestHref(
  assetId: string,
  packId: string,
  purpose = "marketing",
  role = "analyst"
): string {
  const sp = new URLSearchParams({
    pack: packId,
    purpose,
    role,
  });
  return `/metadata/${encodeURIComponent(assetId)}?${sp.toString()}`;
}

function governanceNextActions(
  packId: string,
  assetId = DEFAULT_ASSET_ID
): LuiNextAction[] {
  return [
    {
      label: "打開這筆資產並帶入申請條件",
      href: assetRequestHref(assetId, packId),
    },
    {
      label: "送出或追蹤申請",
      href: MY_REQUESTS_HREF,
    },
    {
      label: "以 owner 審核（示範）",
      href: OWNER_REVIEW_HREF,
    },
  ];
}

function catalogKeywordHref(query: string): string {
  const sp = new URLSearchParams({ q: query, intent: "manual" });
  return `/catalog-search?${sp.toString()}`;
}

function metadataKeywordHref(query: string, packId: string): string {
  const sp = new URLSearchParams({
    q: query,
    pack: packId,
    intent: "manual",
  });
  return `/metadata?${sp.toString()}`;
}

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

function buildEcosystemLuiResponse(
  query: string,
  topic: Exclude<EcosystemTopic, null>
): LuiResponse {
  if (topic === "food") {
    return {
      summary: "示範領域 · 菜餚／食譜仍是 Portal loader 頁，沒有 REST。",
      answer: [
        `關於「${query}」：Portal 的 /dishes 與 /recipes 是 Remix loader seed（誠實示範殼），`,
        "不是 Nest／公開 REST。Vue lab 另有 mock JSON gallery；此處不假裝已有食物 API。",
      ].join(""),
      confidence: 0.88,
      sources: [],
      nextSteps: [
        "開啟 /dishes 看 loader 示範菜餚",
        "開啟 /recipes 看 loader 示範食譜",
        "或在 Vue lab 開啟食譜 gallery（GitHub Pages）",
        "不要期待 /api/dishes 或 /api/recipes",
      ],
      nextActions: [
        { label: "開啟菜餚示範頁（loader）", href: "/dishes" },
        { label: "開啟食譜示範頁（loader）", href: "/recipes" },
        { label: "在 Vue lab 開啟（LIVE）", href: VUE_MOTION_LAB_LIVE },
      ],
    };
  }

  if (topic === "auction") {
    return {
      summary: "生態轉址 · 拍賣 kind 到 Plinth LIVE（結算不在 Portal／nx）。",
      answer: [
        `關於「${query}」：活動類型 auction 的拍品與出價在 Plinth storefront；`,
        "nx event-portal 只列 kind badge 與深鏈。Portal 是目錄＋RAG 轉址，不是拍賣後台。",
      ].join(""),
      confidence: 0.9,
      sources: [],
      nextSteps: [
        "在 Plinth 開啟示範拍品（mock 出價）",
        "需要活動目錄時再開 nx Events LIVE",
      ],
      nextActions: [
        { label: "開啟 Plinth 示範拍品（LIVE）", href: PLINTH_LOT_LIVE },
        { label: "開啟 Plinth 拍賣列表（LIVE）", href: PLINTH_AUCTIONS_LIVE },
        NX_EVENTS_LIVE_ACTION,
      ],
    };
  }

  if (topic === "line_commerce") {
    return {
      summary: "生態轉址 · LINE 商務／報名示範走 nx event-portal LIVE。",
      answer: [
        `關於「${query}」：line_commerce kind 的參加者旅程在 nx event-portal（LIFF／labelled demo）；`,
        "Portal 不合成第二個活動後台，也不假裝 LINE 真上架。",
      ].join(""),
      confidence: 0.88,
      sources: [],
      nextSteps: [
        "開啟 nx Events LIVE 看活動列表",
        "身份／金流仍標 demo，卡人工 STOP",
      ],
      nextActions: [NX_EVENTS_LIVE_ACTION],
    };
  }

  return {
    summary: "生態轉址 · 講座／報名 kind 到 nx event-portal LIVE。",
    answer: [
      `關於「${query}」：talk／工作坊報名與票券旅程在 nx event-portal；`,
      "Portal 只做目錄＋RAG 轉址，不是 event-cms。",
    ].join(""),
    confidence: 0.9,
    sources: [],
    nextSteps: [
      "開啟 nx Events LIVE 看列表→checkout 示範",
      "主辦上架請走獨立 CMS（Kratos），不要在 Portal 找後台",
    ],
    nextActions: [NX_EVENTS_LIVE_ACTION],
  };
}

function buildQueryAwareFixture(query: string, packId: string): LuiResponse {
  const ecosystem = detectEcosystemTopic(query);
  if (ecosystem) {
    return buildEcosystemLuiResponse(query, ecosystem);
  }

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
            encodeURIComponent(DEFAULT_ASSET_ID),
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
      nextActions: governanceNextActions(packId),
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
      nextActions: governanceNextActions(packId),
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
      nextActions: [
        {
          label: "在目錄搜尋 orders",
          href: catalogKeywordHref("orders"),
        },
        {
          label: "打開顧客表並申請",
          href: assetRequestHref(DEFAULT_ASSET_ID, packId, "analytics"),
        },
        {
          label: "追蹤我的申請",
          href: MY_REQUESTS_HREF,
        },
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
    nextActions: [
      {
        label: "在目錄搜尋這句話",
        href: catalogKeywordHref(query),
      },
      {
        label: "在資料資產搜尋",
        href: metadataKeywordHref(query, packId),
      },
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

  const firstHref = sources[0]?.url ?? catalogKeywordHref(query);

  return {
    summary: `已依知識庫找到 ${hits.length} 筆與「${query}」相關的依據。`,
    answer: groundedAnswer,
    confidence: Math.min(0.92, 0.7 + hits.length * 0.05),
    sources,
    nextSteps: [
      "開啟來源連結核對 glossary／敘事細節",
      "用關鍵字在目錄與資料資產交叉驗證",
      "需要權限時走 access-request 示範路徑",
    ],
    nextActions: [
      { label: "開啟這筆來源", href: firstHref },
      { label: "在目錄繼續（僅關鍵字）", href: catalogKeywordHref(query) },
      {
        label: "追蹤我的申請",
        href: MY_REQUESTS_HREF,
      },
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
