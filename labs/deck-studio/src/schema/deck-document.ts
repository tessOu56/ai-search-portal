/**
 * DeckDocument — deck-studio 的契約 SSOT（B0）。
 * 投影片只是 view；本 schema 是唯一真實來源。
 * 規劃：platform-command/planning/projects/deck-studio.md
 */
import { z } from "zod";

export const SlideLayout = z.enum([
  "title",
  "bullets",
  "two-col",
  "quote",
  "demo",
  "closing",
]);

export const Slide = z.object({
  id: z.string().min(1),
  intent: z.string().min(1).describe("這頁存在的理由，一句話"),
  title: z.string().min(1).max(80),
  layout: SlideLayout.default("bullets"),
  bullets: z.array(z.string().min(1).max(140)).max(6).default([]),
  notes: z.string().default("").describe("逐頁講稿（speaker notes）"),
});

export const DeckConstraints = z.object({
  maxSlides: z.number().int().min(1).max(40).default(12),
  maxBulletsPerSlide: z.number().int().min(1).max(8).default(6),
});

export const DeckMeta = z.object({
  title: z.string().min(1),
  audience: z.string().min(1),
  goal: z.string().min(1),
  lang: z.enum(["zh-TW", "en"]).default("zh-TW"),
  version: z.string().default("0.1.0"),
});

export const DeckDocument = z
  .object({
    meta: DeckMeta,
    constraints: DeckConstraints.default({
      maxSlides: 12,
      maxBulletsPerSlide: 6,
    }),
    slides: z.array(Slide).min(1),
  })
  .superRefine((doc, ctx) => {
    if (doc.slides.length > doc.constraints.maxSlides) {
      ctx.addIssue({
        code: "custom",
        message: `slides ${doc.slides.length} > maxSlides ${doc.constraints.maxSlides}`,
        path: ["slides"],
      });
    }
    const ids = new Set<string>();
    for (const s of doc.slides) {
      if (ids.has(s.id))
        ctx.addIssue({
          code: "custom",
          message: `duplicate slide id: ${s.id}`,
          path: ["slides"],
        });
      ids.add(s.id);
      if (s.bullets.length > doc.constraints.maxBulletsPerSlide) {
        ctx.addIssue({
          code: "custom",
          message: `slide ${s.id} bullets > ${doc.constraints.maxBulletsPerSlide}`,
          path: ["slides"],
        });
      }
    }
  });

export type DeckDocumentT = z.infer<typeof DeckDocument>;
export type SlideT = z.infer<typeof Slide>;
