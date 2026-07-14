/**
 * Metadata catalog API contracts.
 * See specs/api/handler-mapping.md
 */

import { z } from "zod";

import { domainFacetsSchema } from "./domain-facets.contract.js";

export const metadataAssetTypeSchema = z.enum([
  "Database",
  "Table",
  "API",
  "Dashboard",
]);

export type MetadataAssetType = z.infer<typeof metadataAssetTypeSchema>;

export const metadataColumnSchema = z.object({
  name: z.string(),
  dataType: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sensitive: z.boolean().optional(),
  /** Display unit for numeric columns, e.g. "TWD/kg", "days". */
  unit: z.string().optional(),
});

export type MetadataColumnContract = z.infer<typeof metadataColumnSchema>;

export const metadataAssetSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  assetType: metadataAssetTypeSchema,
  owner: z.string(),
  tags: z.array(z.string()),
  classification: z.enum(["public", "internal", "PII", "confidential"]),
  updatedAt: z.string(),
  fqn: z.string().optional(),
  /** Optional money/time/region facets; see domain-facets.contract.ts. */
  facets: domainFacetsSchema.optional(),
});

export type MetadataAssetSummaryContract = z.infer<
  typeof metadataAssetSummarySchema
>;

export const metadataAssetDetailSchema = metadataAssetSummarySchema.extend({
  fqn: z.string(),
  columns: z.array(metadataColumnSchema).optional(),
  upstreamIds: z.array(z.string()),
  downstreamIds: z.array(z.string()),
  datasetId: z.string().optional(),
  packId: z.string().optional(),
  metricIds: z.array(z.string()).optional(),
});

export type MetadataAssetDetailContract = z.infer<
  typeof metadataAssetDetailSchema
>;

export const metadataPaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export const listMetadataResponseSchema = z.object({
  data: z.array(metadataAssetSummarySchema),
  pagination: metadataPaginationSchema,
});

export const getMetadataAssetResponseSchema = z.object({
  data: metadataAssetDetailSchema,
});

export const metadataLineageNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["table", "column", "api", "dashboard", "database"]),
});

export const metadataLineageEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
});

export const metadataLineageCycleSchema = z.object({
  message: z.string(),
  nodeIds: z.array(z.string()),
});

export const metadataLineageResponseSchema = z.object({
  data: z.object({
    assetId: z.string(),
    upstream: z.array(metadataAssetSummarySchema),
    downstream: z.array(metadataAssetSummarySchema),
    nodes: z.array(metadataLineageNodeSchema),
    edges: z.array(metadataLineageEdgeSchema),
    dependencyOrder: z.array(metadataLineageNodeSchema).optional(),
    cycleError: metadataLineageCycleSchema.nullable().optional(),
  }),
});
