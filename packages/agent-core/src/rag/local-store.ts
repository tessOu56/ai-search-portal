/**
 * In-memory document store for local RAG (lab / dev).
 * Pack-aware: when packId is set, indexes glossary + narrative + ops from
 * content/context-packs/<packId>/. Falls back to DEFAULT_DOCS.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { inferIndustryFacetsFromText } from "@ai-search-portal/contracts";

export type LocalDoc = {
  id: string;
  text: string;
  tags: string[];
  title?: string;
  kind?: "glossary" | "narrative" | "ops" | "doc";
  refs?: string[];
  /** Origin citation (e.g. `platform-command:specs/domain/pm.yaml#sprint`) — T-2026-071. */
  source?: string;
  facets?: {
    materials?: string[];
    techniques?: string[];
    regions?: string[];
    classification?: string;
    standards?: string[];
    productTypes?: string[];
    auctionEligible?: boolean;
  };
};

const DEFAULT_DOCS: LocalDoc[] = [
  {
    id: "auth-1",
    title: "Authentication",
    kind: "doc",
    text: "Authentication uses OAuth2 and session cookies for the portal API.",
    tags: ["authentication", "security"],
  },
  {
    id: "search-1",
    title: "Catalog search",
    kind: "doc",
    text: "Catalog search supports filter_type for API vs Dataset assets.",
    tags: ["catalog", "search"],
  },
  {
    id: "metadata-1",
    title: "customer_profile",
    kind: "doc",
    text: "The customer_profile table in analytics contains PII fields email and phone.",
    tags: ["metadata", "pii", "catalog"],
  },
  {
    id: "agent-1",
    title: "Agent RAG steps",
    kind: "doc",
    text: "The agent pipeline emits internal.rag_step before streaming answer chunks.",
    tags: ["agent", "rag"],
  },
];

function readJsonArray(filePath: string): unknown[] {
  if (!existsSync(filePath)) return [];
  const raw = JSON.parse(readFileSync(filePath, "utf-8")) as unknown;
  return Array.isArray(raw) ? raw : [];
}

function resolveDefaultContentRoot(start = process.cwd()): string {
  let dir = path.resolve(start);
  for (let i = 0; i < 6; i++) {
    if (existsSync(path.join(dir, "content/context-packs"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

function packDir(contentRoot: string, packId: string): string {
  const root = path.resolve(contentRoot, "content/context-packs");
  const dir = path.resolve(root, packId);
  if (!dir.startsWith(root + path.sep)) {
    throw new Error(`Invalid context pack id: ${packId}`);
  }
  return dir;
}

function readFacets(facets: unknown): LocalDoc["facets"] | undefined {
  if (!facets || typeof facets !== "object") return undefined;
  const f = facets as {
    materials?: string[];
    techniques?: string[];
    regions?: string[];
    classification?: string;
    standards?: string[];
    productTypes?: string[];
    auctionEligible?: boolean;
  };
  return {
    materials: f.materials ?? [],
    techniques: f.techniques ?? [],
    regions: f.regions ?? [],
    classification: f.classification,
    standards: f.standards ?? [],
    productTypes: f.productTypes ?? [],
    auctionEligible: Boolean(f.auctionEligible),
  };
}

function facetTags(facets: LocalDoc["facets"] | undefined): string[] {
  if (!facets) return [];
  return [
    ...(facets.materials ?? []),
    ...(facets.techniques ?? []),
    ...(facets.regions ?? []),
    facets.classification ?? "",
    ...(facets.standards ?? []),
    ...(facets.productTypes ?? []),
    facets.auctionEligible ? "auction" : "",
  ].filter(Boolean);
}

/** Build LocalDoc index from a context pack's knowledge fixtures. */
export function loadPackDocs(
  packId: string,
  contentRoot = resolveDefaultContentRoot()
): LocalDoc[] {
  const dir = packDir(contentRoot, packId);
  const docs: LocalDoc[] = [];

  for (const item of readJsonArray(path.join(dir, "glossary.json"))) {
    const row = item as {
      id?: string;
      term?: string;
      definition?: string;
      relatedAssetIds?: string[];
      tags?: string[];
      source?: string;
      facets?: unknown;
    };
    if (!row.id || !row.term || !row.definition) continue;
    const facets = readFacets(row.facets);
    docs.push({
      id: row.id,
      title: row.term,
      kind: "glossary",
      text: row.definition,
      tags: [
        "glossary",
        ...(row.tags ?? []),
        ...row.term.toLowerCase().split(/\s+/).slice(0, 4),
        ...facetTags(facets),
      ],
      refs: row.relatedAssetIds ?? [],
      source: row.source,
      facets,
    });
  }

  for (const item of readJsonArray(path.join(dir, "narrative.json"))) {
    const row = item as {
      id?: string;
      title?: string;
      summary?: string;
      tags?: string[];
      refs?: string[];
      facets?: unknown;
    };
    if (!row.id || !row.title || !row.summary) continue;
    const facets = readFacets(row.facets);
    docs.push({
      id: row.id,
      title: row.title,
      kind: "narrative",
      text: row.summary,
      tags: [...(row.tags ?? ["narrative"]), ...facetTags(facets)],
      refs: row.refs ?? [],
      facets,
    });
  }

  for (const item of readJsonArray(path.join(dir, "ops.json"))) {
    const row = item as {
      id?: string;
      title?: string;
      summary?: string;
      statusTerms?: string[];
      tags?: string[];
      refs?: string[];
      facets?: unknown;
    };
    if (!row.id || !row.title || !row.summary) continue;
    const status = (row.statusTerms ?? []).join(", ");
    const facets = readFacets(row.facets);
    docs.push({
      id: row.id,
      title: row.title,
      kind: "ops",
      text: status ? `${row.summary} Status terms: ${status}.` : row.summary,
      tags: [
        ...(row.tags ?? []),
        ...(row.statusTerms ?? []),
        ...facetTags(facets),
      ],
      refs: row.refs ?? [],
      facets,
    });
  }

  return docs;
}

/**
 * Meta/PM/engineering/agentic glossary synced from platform-command
 * specs/domain/*.yaml (T-2026-071, scripts/sync-domain-glossary.mjs). Has no
 * pack.json, so it never appears in the user-facing pack switcher — it's
 * merged into every corpus below purely so LUI can ground and cite it.
 */
const ECOSYSTEM_GLOSSARY_PACK_ID = "ecosystem-glossary";

function safeLoadPackDocs(packId: string, contentRoot: string): LocalDoc[] {
  try {
    return loadPackDocs(packId, contentRoot);
  } catch {
    return [];
  }
}

function dedupeById(docs: LocalDoc[]): LocalDoc[] {
  const seen = new Set<string>();
  const out: LocalDoc[] = [];
  for (const doc of docs) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    out.push(doc);
  }
  return out;
}

export type RetrieveLocalOptions = {
  packId?: string | null;
  contentRoot?: string;
  docs?: LocalDoc[];
  /** When pack loads empty, keep portal DEFAULT_DOCS as fallback. Default true. */
  includeDefaults?: boolean;
};

export function resolveRagCorpus(options: RetrieveLocalOptions = {}): {
  docs: LocalDoc[];
  packId?: string;
} {
  const packId =
    options.packId ??
    process.env.AGENT_RAG_PACK ??
    process.env.CONTEXT_PACK ??
    null;

  if (options.docs) {
    return { docs: options.docs, packId: packId ?? undefined };
  }

  const includeDefaults = options.includeDefaults !== false;
  const contentRoot = options.contentRoot ?? resolveDefaultContentRoot();
  const ecosystemDocs = includeDefaults
    ? safeLoadPackDocs(ECOSYSTEM_GLOSSARY_PACK_ID, contentRoot)
    : [];

  if (packId) {
    try {
      const packDocs = loadPackDocs(packId, contentRoot);
      if (packDocs.length > 0) {
        return {
          docs: includeDefaults
            ? dedupeById([...packDocs, ...ecosystemDocs, ...DEFAULT_DOCS])
            : packDocs,
          packId,
        };
      }
    } catch {
      // fall through to defaults
    }
  }

  return {
    docs: includeDefaults
      ? dedupeById([...DEFAULT_DOCS, ...ecosystemDocs])
      : DEFAULT_DOCS,
  };
}

export function retrieveLocal(
  query: string,
  options: RetrieveLocalOptions = {}
): LocalDoc[] {
  const { docs } = resolveRagCorpus(options);
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 0);
  const inferred = inferIndustryFacetsFromText(query);
  const scored = docs.map((doc) => {
    const title = (doc.title ?? "").toLowerCase();
    const facetHay = [
      ...(doc.facets?.materials ?? []),
      ...(doc.facets?.techniques ?? []),
      ...(doc.facets?.standards ?? []),
      ...(doc.facets?.productTypes ?? []),
      doc.facets?.classification ?? "",
      doc.facets?.auctionEligible ? "auction" : "",
    ]
      .join(" ")
      .toLowerCase();
    const hay =
      `${title} ${doc.text} ${doc.tags.join(" ")} ${(doc.refs ?? []).join(" ")} ${facetHay}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (t.length <= 1) continue;
      if (hay.includes(t)) score += 2;
    }
    if (title && (q.includes(title) || title.includes(q))) score += 5;
    // CJK / compound queries: match title tokens and tags inside the full query
    for (const part of title
      .split(/[\s()（）/,，]+/)
      .filter((p) => p.length >= 2)) {
      if (q.includes(part)) score += 4;
    }
    for (const tag of doc.tags) {
      const t = tag.toLowerCase();
      if (t.length >= 2 && q.includes(t)) score += 3;
    }
    // Industry facet boost — prefer hallmark / material aligned docs
    if (inferred.standard) {
      const standards = (doc.facets?.standards ?? []).map((s) =>
        s.toLowerCase()
      );
      const std = inferred.standard.toLowerCase();
      if (
        standards.some((s) => s === std || s.includes(std) || std.includes(s))
      ) {
        score += 8;
      }
    }
    if (
      inferred.material &&
      (doc.facets?.materials ?? []).includes(inferred.material)
    ) {
      score += 6;
    }
    // Commerce facet boost — product type / auction eligibility
    if (
      inferred.productType &&
      (doc.facets?.productTypes ?? []).includes(inferred.productType)
    ) {
      score += 7;
    }
    if (inferred.auctionEligible && doc.facets?.auctionEligible) {
      score += 8;
    }
    return { doc, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.doc)
    .slice(0, 3);
}

export { DEFAULT_DOCS };
