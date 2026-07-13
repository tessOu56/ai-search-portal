/**
 * Declarative Generative UI document contracts (JSON-Render style).
 */

import { z } from "zod";

import {
  metadataColumnSchema,
  metadataLineageCycleSchema,
  metadataLineageEdgeSchema,
  metadataLineageNodeSchema,
} from "./metadata.contract.js";

export const genUiNodeTypeSchema = z.enum([
  "data-lineage-graph",
  "metadata-columns-table",
  "metadata-summary-card",
]);

export type GenUiNodeType = z.infer<typeof genUiNodeTypeSchema>;

export const lineageGraphPropsSchema = z.object({
  nodes: z.array(metadataLineageNodeSchema),
  edges: z.array(metadataLineageEdgeSchema),
  dependencyOrder: z.array(metadataLineageNodeSchema).optional(),
  cycleError: metadataLineageCycleSchema.nullable().optional(),
  themeMode: z.enum(["light", "dark"]).default("dark"),
});

export const metadataColumnsTablePropsSchema = z.object({
  columns: z.array(metadataColumnSchema),
  maskFields: z.array(z.string()).default([]),
});

export const metadataSummaryCardPropsSchema = z.object({
  name: z.string(),
  fqn: z.string(),
  owner: z.string(),
  classification: z.string(),
  tags: z.array(z.string()),
});

export const genUiNodeSchema = z.object({
  type: genUiNodeTypeSchema,
  props: z.record(z.string(), z.unknown()),
});

export const genUiDocumentSchema = z.object({
  version: z.literal("1"),
  nodes: z.array(genUiNodeSchema),
});

export type GenUiDocumentContract = z.infer<typeof genUiDocumentSchema>;
