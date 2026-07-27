/**
 * Dynamic knowledge search over context-pack corpus (glossary / narrative / ops).
 * Supports industry facet filters for product / gallery aligned retrieval.
 */

import {
  type KnowledgeChunkContract,
  type KnowledgeChunkKind,
  type KnowledgeClassification,
  type KnowledgeMaterial,
  type KnowledgeProductType,
  knowledgeSearchResponseSchema,
  type KnowledgeTechnique,
} from "@ai-search-portal/contracts";

import {
  loadPackKnowledgeGlossary,
  loadPackNarrative,
  loadPackOps,
  resolveContentRoot,
} from "~/shared/services/context-pack-loader.server";
import {
  chunksFromGlossary,
  chunksFromNarrative,
  chunksFromOps,
  collectKnowledgeFacets,
  filterKnowledgeChunks,
  mergeKnowledgeChunks,
  scoreKnowledgeChunks,
} from "~/shared/services/knowledge-chunks";

export type KnowledgeSearchParams = {
  q?: string;
  packId: string;
  kind?: KnowledgeChunkKind;
  material?: KnowledgeMaterial;
  technique?: KnowledgeTechnique;
  region?: string;
  classification?: KnowledgeClassification;
  standard?: string;
  productType?: KnowledgeProductType;
  auctionEligible?: boolean;
  limit?: number;
};

export function buildPackKnowledgeCorpus(
  packId: string,
  contentRoot = resolveContentRoot()
): KnowledgeChunkContract[] {
  return mergeKnowledgeChunks([
    chunksFromGlossary(loadPackKnowledgeGlossary(packId, contentRoot)),
    chunksFromNarrative(loadPackNarrative(packId, contentRoot)),
    chunksFromOps(loadPackOps(packId, contentRoot)),
  ]);
}

export function searchKnowledge(params: KnowledgeSearchParams) {
  const limit = params.limit ?? 10;
  let chunks = buildPackKnowledgeCorpus(params.packId);
  if (params.kind) {
    chunks = chunks.filter((c) => c.kind === params.kind);
  }
  chunks = filterKnowledgeChunks(chunks, {
    material: params.material,
    technique: params.technique,
    region: params.region,
    classification: params.classification,
    standard: params.standard,
    productType: params.productType,
    auctionEligible: params.auctionEligible,
  });

  const facets = collectKnowledgeFacets(chunks);
  const matched = scoreKnowledgeChunks(
    params.q ?? "",
    chunks,
    Math.max(chunks.length, limit)
  );
  const ranked = matched.slice(0, limit);
  return knowledgeSearchResponseSchema.parse({
    data: ranked,
    total: params.q?.trim() ? matched.length : chunks.length,
    packId: params.packId,
    facets,
  });
}
