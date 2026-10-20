/** Closed analytics schemas — no query text or free-form bags. */

import { z } from "zod";

import { accessPurposeSchema } from "./access-request.contract.js";

const eventIdSchema = z.string().min(1);
const timestampSchema = z.string().datetime();
const hashedIdSchema = z.string().min(1).max(128);

export const analyticsEventNameSchema = z.enum([
  "task_completed",
  "ai_fallback_taken",
  "hitl_intervened",
  "access_request_submitted",
  "search_submitted",
  "answer_rendered",
  "citation_clicked",
]);

export const analyticsSurfaceSchema = z.enum([
  "chat",
  "catalog_search",
  "api_detail",
  "access_request",
]);

const analyticsBaseEventSchema = z
  .object({
    eventId: eventIdSchema,
    at: timestampSchema,
    sessionId: hashedIdSchema.optional(),
    userHash: hashedIdSchema.optional(),
    surface: analyticsSurfaceSchema,
  })
  .strict();

export const taskCompletedEventSchema = analyticsBaseEventSchema
  .extend({
    name: z.literal("task_completed"),
    properties: z
      .object({
        taskType: z.enum([
          "chat_answer",
          "catalog_search",
          "access_request",
          "tool_execution",
        ]),
        durationMs: z.number().nonnegative(),
        success: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const aiFallbackTakenEventSchema = analyticsBaseEventSchema
  .extend({
    name: z.literal("ai_fallback_taken"),
    properties: z
      .object({
        fallbackType: z.enum(["rule_guardrail", "model_error", "timeout"]),
        recoveryAction: z.enum([
          "manual_retry",
          "static_panel",
          "human_review",
        ]),
      })
      .strict(),
  })
  .strict();

export const hitlIntervenedEventSchema = analyticsBaseEventSchema
  .extend({
    name: z.literal("hitl_intervened"),
    properties: z
      .object({
        interventionType: z.enum(["approval", "denial", "edit", "escalation"]),
        queue: z.enum(["access_request", "ai_fallback", "policy_review"]),
      })
      .strict(),
  })
  .strict();

export const accessRequestSubmittedEventSchema = analyticsBaseEventSchema
  .extend({
    name: z.literal("access_request_submitted"),
    properties: z
      .object({
        assetId: z.string().min(1).max(128),
        purpose: accessPurposeSchema,
        requiresApproval: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const searchSubmittedEventSchema = analyticsBaseEventSchema
  .extend({
    name: z.literal("search_submitted"),
    properties: z
      .object({
        queryLength: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const answerRenderedEventSchema = analyticsBaseEventSchema
  .extend({
    name: z.literal("answer_rendered"),
    properties: z
      .object({
        hasSummary: z.boolean(),
        sourceCount: z.number().int().nonnegative(),
        durationMs: z.number().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const citationClickedEventSchema = analyticsBaseEventSchema
  .extend({
    name: z.literal("citation_clicked"),
    properties: z
      .object({
        kind: z.enum(["internal", "external"]),
        index: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const analyticsEventSchema = z.discriminatedUnion("name", [
  taskCompletedEventSchema,
  aiFallbackTakenEventSchema,
  hitlIntervenedEventSchema,
  accessRequestSubmittedEventSchema,
  searchSubmittedEventSchema,
  answerRenderedEventSchema,
  citationClickedEventSchema,
]);

export type AnalyticsEventName = z.infer<typeof analyticsEventNameSchema>;
export type AnalyticsEventContract = z.infer<typeof analyticsEventSchema>;

/** Page-performance sample; not a product interaction event. */
export const webVitalNameSchema = z.enum(["LCP", "INP", "CLS"]);

export const webVitalRatingSchema = z.enum([
  "good",
  "needs-improvement",
  "poor",
]);

export const webVitalReportedEventSchema = z
  .object({
    name: webVitalNameSchema,
    value: z.number().nonnegative(),
    rating: webVitalRatingSchema,
    route: z.string().min(1).max(256),
  })
  .strict();

export type WebVitalName = z.infer<typeof webVitalNameSchema>;
export type WebVitalRating = z.infer<typeof webVitalRatingSchema>;
export type WebVitalReportedEvent = z.infer<typeof webVitalReportedEventSchema>;
