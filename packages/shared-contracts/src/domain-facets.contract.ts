/**
 * Domain facet primitives — structured money / time / region shared by all
 * domain packs (agri, metalcraft, ...).
 *
 * Design rules:
 * - Every facet is an OPTIONAL add-on. Existing packs and consumers are
 *   unaffected (schemas strip unknown keys), so adoption can be incremental.
 * - Scenario-trigger data design that uses these facets is documented in
 *   content/context-packs/SCENARIOS.md.
 */

import { z } from "zod";

/** ISO 4217 money value with an optional pricing basis. */
export const monetaryAmountSchema = z.object({
  amount: z.number(),
  /** ISO 4217 code, e.g. "TWD". */
  currency: z.string().min(3).max(3),
  /** Pricing basis: "kg", "g", "session", "half_day", "unit". */
  per: z.string().optional(),
});

export type MonetaryAmountContract = z.infer<typeof monetaryAmountSchema>;

/** Stable region reference; code is the join key across domains. */
export const regionRefSchema = z.object({
  /** e.g. "TW-TPE", "TW-NORTH" (agri market circles reuse the same space). */
  code: z.string(),
  /** Display label, e.g. "台北", "北台灣批發圈". */
  label: z.string().optional(),
  level: z.enum(["country", "region", "city", "district", "market"]).optional(),
});

export type RegionRefContract = z.infer<typeof regionRefSchema>;

/** ISO 8601 window; absent end means open-ended. */
export const timeWindowSchema = z.object({
  start: z.string(),
  end: z.string().optional(),
  /** IANA zone, e.g. "Asia/Taipei". */
  timezone: z.string().optional(),
  /** Recurrence hint, e.g. "seasonal:JUL-SEP", "weekly:SAT". */
  recurrence: z.string().optional(),
});

export type TimeWindowContract = z.infer<typeof timeWindowSchema>;

/**
 * Explicit completeness signal so "partial but reasonable" data is a modeled
 * state, not an accident. UIs may render degraded-but-usable views for
 * "partial" and prompt remediation for "minimal".
 */
export const dataCompletenessSchema = z.enum([
  "complete",
  "partial",
  "minimal",
]);

export type DataCompletenessContract = z.infer<typeof dataCompletenessSchema>;

/** Facet bundle attached to metadata assets (all optional). */
export const domainFacetsSchema = z.object({
  /** Domain key: "agri" | "metalcraft" | future domains. */
  domain: z.string().optional(),
  pricing: monetaryAmountSchema.optional(),
  region: regionRefSchema.optional(),
  timeWindow: timeWindowSchema.optional(),
  completeness: dataCompletenessSchema.optional(),
});

export type DomainFacetsContract = z.infer<typeof domainFacetsSchema>;

/** Point-in-time metric reading (money/duration/count...) with provenance. */
export const metricValueSchema = z.object({
  value: z.number(),
  /** Display unit, e.g. "TWD/kg", "days", "%". */
  unit: z.string().optional(),
  /** ISO 8601 timestamp of the reading. */
  asOf: z.string(),
  region: regionRefSchema.optional(),
});

export type MetricValueContract = z.infer<typeof metricValueSchema>;

export const metricValueTypeSchema = z.enum([
  "money",
  "duration",
  "count",
  "ratio",
  "score",
]);

export type MetricValueTypeContract = z.infer<typeof metricValueTypeSchema>;
