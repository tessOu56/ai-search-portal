/**
 * Build searchable / RAG-ready knowledge chunks from pack fixtures.
 */

import type {
  KnowledgeChunkContract,
  KnowledgeClassification,
  KnowledgeGlossaryEntryContract,
  KnowledgeIndustryFacets,
  KnowledgeNarrativeEntryContract,
  KnowledgeOpsEntryContract,
  MetadataAssetDetailContract,
} from "@ai-search-portal/contracts";
import {
  knowledgeChunkSchema,
  standardsMatch,
} from "@ai-search-portal/contracts";

function defaultFacets(
  partial?: KnowledgeIndustryFacets,
  classification: KnowledgeClassification = "general"
): KnowledgeIndustryFacets {
  return {
    materials: partial?.materials ?? [],
    techniques: partial?.techniques ?? [],
    regions: partial?.regions ?? [],
    classification: partial?.classification ?? classification,
    locale: partial?.locale ?? "zh-TW",
    standards: partial?.standards ?? [],
    productTypes: partial?.productTypes ?? [],
    auctionEligible: partial?.auctionEligible ?? false,
  };
}

function facetHaystack(facets: KnowledgeIndustryFacets): string {
  return [
    ...facets.materials,
    ...facets.techniques,
    ...facets.regions,
    facets.classification,
    facets.locale,
    ...facets.standards,
    ...facets.productTypes,
    facets.auctionEligible ? "auction" : "",
  ]
    .join(" ")
    .toLowerCase();
}

export function chunksFromGlossary(
  terms: KnowledgeGlossaryEntryContract[]
): KnowledgeChunkContract[] {
  return terms.map((term) => {
    const facets = defaultFacets(term.facets, "general");
    const titleTokens = term.term.toLowerCase().split(/\s+/).slice(0, 4);
    const tags = [
      ...new Set(["glossary", ...(term.tags ?? []), ...titleTokens]),
    ];
    return knowledgeChunkSchema.parse({
      id: term.id,
      kind: "glossary",
      title: term.term,
      text: term.definition,
      tags,
      refs: term.relatedAssetIds,
      facets,
    });
  });
}

export function chunksFromNarrative(
  entries: KnowledgeNarrativeEntryContract[]
): KnowledgeChunkContract[] {
  return entries.map((entry) =>
    knowledgeChunkSchema.parse({
      id: entry.id,
      kind: "narrative",
      title: entry.title,
      text: entry.summary,
      tags: entry.tags,
      refs: entry.refs,
      facets: defaultFacets(
        entry.facets,
        entry.entityType === "product" ? "commerce" : "general"
      ),
    })
  );
}

export function chunksFromOps(
  entries: KnowledgeOpsEntryContract[]
): KnowledgeChunkContract[] {
  return entries.map((entry) =>
    knowledgeChunkSchema.parse({
      id: entry.id,
      kind: "ops",
      title: entry.title,
      text: `${entry.summary} Status terms: ${entry.statusTerms.join(", ")}.`,
      tags: [...entry.tags, ...entry.statusTerms],
      refs: entry.refs,
      facets: defaultFacets(entry.facets, "studio_ops"),
    })
  );
}

/** Optional: project metadata assets as narrative-like fallback chunks. */
export function chunksFromAssets(
  assets: MetadataAssetDetailContract[]
): KnowledgeChunkContract[] {
  return assets.map((asset) =>
    knowledgeChunkSchema.parse({
      id: `asset-${asset.id}`,
      kind: "narrative",
      title: asset.name,
      text: `${asset.description} (${asset.assetType}; ${asset.fqn})`,
      tags: [asset.assetType, ...asset.tags],
      refs: [asset.id, ...asset.upstreamIds, ...asset.downstreamIds],
      facets: defaultFacets(undefined, "general"),
    })
  );
}

export function mergeKnowledgeChunks(
  parts: KnowledgeChunkContract[][]
): KnowledgeChunkContract[] {
  const byId = new Map<string, KnowledgeChunkContract>();
  for (const list of parts) {
    for (const chunk of list) {
      byId.set(chunk.id, chunk);
    }
  }
  return [...byId.values()];
}

export type KnowledgeFacetFilters = {
  material?: string;
  technique?: string;
  region?: string;
  classification?: string;
  standard?: string;
  productType?: string;
  /** When true, keep only auction-eligible chunks. */
  auctionEligible?: boolean;
};

export function filterKnowledgeChunks(
  chunks: KnowledgeChunkContract[],
  filters: KnowledgeFacetFilters = {}
): KnowledgeChunkContract[] {
  return chunks.filter((chunk) => {
    if (
      filters.material &&
      !chunk.facets.materials.includes(
        filters.material as KnowledgeChunkContract["facets"]["materials"][number]
      )
    ) {
      return false;
    }
    if (
      filters.technique &&
      !chunk.facets.techniques.includes(
        filters.technique as KnowledgeChunkContract["facets"]["techniques"][number]
      )
    ) {
      return false;
    }
    if (
      filters.region &&
      chunk.facets.regions.length > 0 &&
      !chunk.facets.regions
        .map((r) => r.toLowerCase())
        .includes(filters.region.toLowerCase())
    ) {
      return false;
    }
    if (
      filters.classification &&
      chunk.facets.classification !== filters.classification
    ) {
      return false;
    }
    if (
      filters.standard &&
      !standardsMatch(chunk.facets.standards, filters.standard)
    ) {
      return false;
    }
    if (
      filters.productType &&
      !chunk.facets.productTypes.includes(
        filters.productType as KnowledgeChunkContract["facets"]["productTypes"][number]
      )
    ) {
      return false;
    }
    return (
      filters.auctionEligible !== true || chunk.facets.auctionEligible === true
    );
  });
}

export function collectKnowledgeFacets(chunks: KnowledgeChunkContract[]) {
  const materials = new Set<string>();
  const techniques = new Set<string>();
  const regions = new Set<string>();
  const classifications = new Set<string>();
  const kinds = new Set<string>();
  const standards = new Set<string>();
  const productTypes = new Set<string>();
  let auctionEligible = false;
  for (const chunk of chunks) {
    kinds.add(chunk.kind);
    classifications.add(chunk.facets.classification);
    for (const m of chunk.facets.materials) materials.add(m);
    for (const t of chunk.facets.techniques) techniques.add(t);
    for (const r of chunk.facets.regions) regions.add(r);
    for (const s of chunk.facets.standards) standards.add(s);
    for (const p of chunk.facets.productTypes) productTypes.add(p);
    if (chunk.facets.auctionEligible) auctionEligible = true;
  }
  return {
    materials: [...materials].sort(),
    techniques: [...techniques].sort(),
    regions: [...regions].sort(),
    classifications: [...classifications].sort(),
    kinds: [...kinds].sort(),
    standards: [...standards].sort(),
    productTypes: [...productTypes].sort(),
    auctionEligible,
  };
}

function scoreTokenHits(tokens: string[], hay: string): number {
  let score = 0;
  for (const t of tokens) {
    if (hay.includes(t)) score += t.length > 1 ? 2 : 1;
  }
  return score;
}

function scoreTitleTagHits(
  query: string,
  title: string,
  tags: string[],
  standards: string[]
): number {
  let score = 0;
  if (title.includes(query) || query.includes(title)) score += 5;
  for (const part of title
    .split(/[\s()（）/,，]+/)
    .filter((p) => p.length >= 2)) {
    if (query.includes(part)) score += 4;
  }
  for (const tag of tags) {
    const t = tag.toLowerCase();
    if (t.length >= 2 && query.includes(t)) score += 3;
  }
  for (const std of standards) {
    if (query.includes(std.toLowerCase())) score += 4;
  }
  return score;
}

function scoreKnowledgeChunk(
  query: string,
  tokens: string[],
  chunk: KnowledgeChunkContract
): number {
  const title = chunk.title.toLowerCase();
  const hay = [
    title,
    chunk.text,
    chunk.tags.join(" "),
    chunk.refs.join(" "),
    facetHaystack(chunk.facets),
  ]
    .join(" ")
    .toLowerCase();
  return (
    scoreTokenHits(tokens, hay) +
    scoreTitleTagHits(query, title, chunk.tags, chunk.facets.standards)
  );
}

export function scoreKnowledgeChunks(
  query: string,
  chunks: KnowledgeChunkContract[],
  limit = 10
): KnowledgeChunkContract[] {
  const q = query.trim().toLowerCase();
  if (!q) return chunks.slice(0, limit);

  const tokens = q.split(/\s+/).filter((t) => t.length > 0);
  const scored = chunks.map((chunk) => ({
    chunk,
    score: scoreKnowledgeChunk(q, tokens, chunk),
  }));

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.chunk);
}
