/**
 * Domain knowledge chunks — shared shape for portal RAG / dynamic search
 * and metalcraft knowledge surfaces (dual-entry, no repo merge).
 *
 * Industry facets follow studio / gallery catalog practice:
 * material · technique · region · classification · locale.
 */

import { z } from "zod";

import { knowledgeIndustryStandardCodeSchema } from "./industry-codes.js";

export const knowledgeChunkKindSchema = z.enum([
  "glossary",
  "narrative",
  "ops",
]);

export type KnowledgeChunkKind = z.infer<typeof knowledgeChunkKindSchema>;

/** Common precious / craft materials used in metalwork catalogs. */
export const knowledgeMaterialSchema = z.enum([
  "sterling_silver",
  "fine_silver",
  "gold",
  "copper",
  "brass",
  "bronze",
  "mixed",
  "other",
]);

export type KnowledgeMaterial = z.infer<typeof knowledgeMaterialSchema>;

/** Core studio techniques (industry vocabulary, not exhaustive). */
export const knowledgeTechniqueSchema = z.enum([
  "forging",
  "annealing",
  "polishing",
  "casting",
  "lost_wax",
  "soldering",
  "chasing",
  "patination",
  "stone_setting",
  "other",
]);

export type KnowledgeTechnique = z.infer<typeof knowledgeTechniqueSchema>;

/** Product / content classification aligned with Plinth + catalog UX. */
export const knowledgeClassificationSchema = z.enum([
  "material",
  "technique",
  "commerce",
  "auction",
  "studio_ops",
  "experience",
  "provenance",
  "general",
]);

export type KnowledgeClassification = z.infer<
  typeof knowledgeClassificationSchema
>;

/** Commerce product types — aligned with Plinth ProductTypeSchema. */
export const knowledgeProductTypeSchema = z.enum([
  "experience",
  "physical",
  "material",
  "tool",
  "venue_rental",
]);

export type KnowledgeProductType = z.infer<typeof knowledgeProductTypeSchema>;

export const knowledgeIndustryFacetsSchema = z.object({
  materials: z.array(knowledgeMaterialSchema).default([]),
  techniques: z.array(knowledgeTechniqueSchema).default([]),
  /** ISO-like region codes used in Plinth (TPE, NTP, …) or TW-* pack codes. */
  regions: z.array(z.string().min(1)).default([]),
  classification: knowledgeClassificationSchema.default("general"),
  locale: z.string().min(2).default("zh-TW"),
  /** Optional industry codes (e.g. hallmark 925, karat 18K). */
  standards: z.array(z.string()).default([]),
  /** Commerce product types when the chunk maps to sellable entities. */
  productTypes: z.array(knowledgeProductTypeSchema).default([]),
  /** True when linked products are auction-eligible (孤品 / timed lots). */
  auctionEligible: z.boolean().default(false),
});

export type KnowledgeIndustryFacets = z.infer<
  typeof knowledgeIndustryFacetsSchema
>;

const emptyIndustryFacets = (): z.infer<
  typeof knowledgeIndustryFacetsSchema
> => ({
  materials: [],
  techniques: [],
  regions: [],
  classification: "general",
  locale: "zh-TW",
  standards: [],
  productTypes: [],
  auctionEligible: false,
});

export const knowledgeChunkSchema = z.object({
  id: z.string().min(1),
  kind: knowledgeChunkKindSchema,
  title: z.string().min(1),
  text: z.string().min(1),
  tags: z.array(z.string()).default([]),
  refs: z.array(z.string()).default([]),
  facets: knowledgeIndustryFacetsSchema.default(emptyIndustryFacets),
});

export type KnowledgeChunkContract = z.infer<typeof knowledgeChunkSchema>;

export const knowledgeSearchQuerySchema = z.object({
  q: z.string().optional().default(""),
  pack: z.string().min(1).optional(),
  kind: knowledgeChunkKindSchema.optional(),
  material: knowledgeMaterialSchema.optional(),
  technique: knowledgeTechniqueSchema.optional(),
  region: z.string().min(1).optional(),
  classification: knowledgeClassificationSchema.optional(),
  /** Canonical or alias industry code (e.g. 925, Ag925, 18K, Au750). */
  standard: knowledgeIndustryStandardCodeSchema.optional(),
  productType: knowledgeProductTypeSchema.optional(),
  /** Filter to auction-eligible chunks when true. */
  auctionEligible: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (typeof v === "boolean") return v;
      return v === "true" || v === "1";
    }),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

export type KnowledgeSearchQuery = z.infer<typeof knowledgeSearchQuerySchema>;

export const knowledgeSearchFacetsSchema = z.object({
  materials: z.array(z.string()).default([]),
  techniques: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  classifications: z.array(z.string()).default([]),
  kinds: z.array(z.string()).default([]),
  standards: z.array(z.string()).default([]),
  productTypes: z.array(z.string()).default([]),
  /** Whether any matched chunk is auction-eligible. */
  auctionEligible: z.boolean().default(false),
});

const emptySearchFacets = (): z.infer<typeof knowledgeSearchFacetsSchema> => ({
  materials: [],
  techniques: [],
  regions: [],
  classifications: [],
  kinds: [],
  standards: [],
  productTypes: [],
  auctionEligible: false,
});

export const knowledgeSearchResponseSchema = z.object({
  data: z.array(knowledgeChunkSchema),
  total: z.number().int().nonnegative(),
  packId: z.string(),
  /** Available facet values in the matched (pre-limit) corpus slice. */
  facets: knowledgeSearchFacetsSchema.default(emptySearchFacets),
});

export type KnowledgeSearchResponse = z.infer<
  typeof knowledgeSearchResponseSchema
>;

/** Enriched glossary entry for pack glossary.json (backward-compatible). */
export const knowledgeGlossaryEntrySchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  definition: z.string().min(1),
  relatedAssetIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  facets: knowledgeIndustryFacetsSchema.optional(),
});

export type KnowledgeGlossaryEntryContract = z.infer<
  typeof knowledgeGlossaryEntrySchema
>;

/** Studio ops stub (thin layer) — stored in pack ops.json */
export const knowledgeOpsEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  statusTerms: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  refs: z.array(z.string()).default([]),
  facets: knowledgeIndustryFacetsSchema.optional(),
});

export type KnowledgeOpsEntryContract = z.infer<typeof knowledgeOpsEntrySchema>;

/** Product / studio narrative stub — stored in pack narrative.json */
export const knowledgeNarrativeEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  entityType: z.enum([
    "studio",
    "designer",
    "product",
    "auction",
    "platform_event",
  ]),
  tags: z.array(z.string()).default([]),
  refs: z.array(z.string()).default([]),
  facets: knowledgeIndustryFacetsSchema.optional(),
});

export type KnowledgeNarrativeEntryContract = z.infer<
  typeof knowledgeNarrativeEntrySchema
>;
