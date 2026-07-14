/**
 * Context Pack contracts — domain-neutral context graph primitives.
 * Domain content lives in content/context-packs/* only.
 */

import { z } from "zod";

import {
  metricValueSchema,
  metricValueTypeSchema,
} from "./domain-facets.contract.js";

export const contextPackManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  defaultLocale: z.string().default("en"),
});

export type ContextPackManifestContract = z.infer<
  typeof contextPackManifestSchema
>;

export const contextRecentChangeSchema = z.object({
  date: z.string(),
  change: z.string(),
});

export type ContextRecentChangeContract = z.infer<
  typeof contextRecentChangeSchema
>;

export const contextMetricSchema = z.object({
  id: z.string(),
  definition: z.string(),
  owner: z.string(),
  sourceAssetId: z.string(),
  upstreamJobIds: z.array(z.string()).default([]),
  downstreamDashboardIds: z.array(z.string()).default([]),
  qualityRules: z.array(z.string()).default([]),
  accessPolicy: z.string(),
  recentChanges: z.array(contextRecentChangeSchema).default([]),
  /** What kind of value this metric carries (money/duration/...). */
  valueType: metricValueTypeSchema.optional(),
  /** Latest reading with unit/asOf/region provenance. */
  latestValue: metricValueSchema.optional(),
});

export type ContextMetricContract = z.infer<typeof contextMetricSchema>;

export const contextGlossaryTermSchema = z.object({
  id: z.string(),
  term: z.string(),
  definition: z.string(),
  relatedAssetIds: z.array(z.string()).default([]),
});

export type ContextGlossaryTermContract = z.infer<
  typeof contextGlossaryTermSchema
>;

export const domainBindingSchema = z.object({
  contextRef: z.string(),
  module: z.string(),
  entityId: z.string(),
  relation: z.string(),
});

export type DomainBindingContract = z.infer<typeof domainBindingSchema>;

export const domainBindingsFileSchema = z.object({
  bindings: z.array(domainBindingSchema).default([]),
});

export const listContextPacksResponseSchema = z.object({
  data: z.array(contextPackManifestSchema),
});

export const getContextMetricResponseSchema = z.object({
  data: contextMetricSchema,
});

export const resolvedDomainBindingSchema = domainBindingSchema.extend({
  resolved: z.boolean(),
  entityName: z.string().optional(),
});

export const getContextBindingsResponseSchema = z.object({
  data: z.array(resolvedDomainBindingSchema),
});

export const DEFAULT_CONTEXT_PACK_ID = "enterprise-mau";
