/**
 * MSW handlers for /api/knowledge/search — industry-faceted knowledge corpus.
 * Mirrors route validation (invalid facets → 400).
 */

import { http, HttpResponse } from "msw";

import {
  knowledgeChunkKindSchema,
  knowledgeChunkSchema,
  knowledgeClassificationSchema,
  knowledgeIndustryStandardCodeSchema,
  knowledgeMaterialSchema,
  knowledgeProductTypeSchema,
  knowledgeSearchResponseSchema,
  knowledgeTechniqueSchema,
  standardsMatch,
} from "~/shared/contracts";

const FIXTURE_CHUNKS = [
  knowledgeChunkSchema.parse({
    id: "term-one-off",
    kind: "glossary",
    title: "孤品 (One-off piece)",
    text: "A unique, non-reproducible piece (stock = 1) sold via timed auction.",
    tags: ["glossary", "孤品"],
    refs: ["prod-phy-2"],
    facets: {
      materials: ["mixed"],
      techniques: ["forging"],
      regions: [],
      classification: "auction",
      locale: "zh-TW",
      standards: [],
      productTypes: ["physical"],
      auctionEligible: true,
    },
  }),
  knowledgeChunkSchema.parse({
    id: "term-925-silver",
    kind: "glossary",
    title: "925 銀 (Sterling silver)",
    text: "92.5% silver alloy (hallmark 925).",
    tags: ["glossary", "925", "銀"],
    refs: ["prod-mat-1"],
    facets: {
      materials: ["sterling_silver"],
      techniques: [],
      regions: [],
      classification: "material",
      locale: "zh-TW",
      standards: ["925"],
      productTypes: ["material"],
      auctionEligible: false,
    },
  }),
  knowledgeChunkSchema.parse({
    id: "term-hallmark",
    kind: "glossary",
    title: "印記 / 成色標 (Hallmark)",
    text: "Assay / purity mark on precious metal.",
    tags: ["glossary", "hallmark"],
    refs: ["prod-mat-1"],
    facets: {
      materials: ["sterling_silver", "gold"],
      techniques: [],
      regions: [],
      classification: "provenance",
      locale: "zh-TW",
      standards: ["925", "18K"],
    },
  }),
  knowledgeChunkSchema.parse({
    id: "narr-studio-1",
    kind: "narrative",
    title: "青銅作坊 Bronze Atelier",
    text: "台北大安區金工工作室，手作金工與當代首飾。",
    tags: ["studio", "TPE"],
    refs: ["studio-1"],
    facets: {
      materials: ["sterling_silver"],
      techniques: ["forging"],
      regions: ["TPE"],
      classification: "general",
      locale: "zh-TW",
      standards: ["925"],
    },
  }),
  knowledgeChunkSchema.parse({
    id: "narr-prod-exp-1",
    kind: "narrative",
    title: "銀戒鍛造入門體驗",
    text: "4 小時完成一枚專屬銀戒，含退火與拋光。",
    tags: ["product", "experience"],
    refs: ["prod-exp-1"],
    facets: {
      materials: ["sterling_silver"],
      techniques: ["forging"],
      regions: ["TPE"],
      classification: "experience",
      locale: "zh-TW",
      standards: ["925"],
      productTypes: ["experience"],
      auctionEligible: false,
    },
  }),
  knowledgeChunkSchema.parse({
    id: "ops-order-lifecycle",
    kind: "ops",
    title: "訂單狀態機（薄 stub）",
    text: "Order: pending → confirmed → completed | cancelled.",
    tags: ["ops", "order", "pending"],
    refs: ["ord-1"],
    facets: {
      materials: [],
      techniques: [],
      regions: ["TPE"],
      classification: "studio_ops",
      locale: "zh-TW",
      standards: [],
    },
  }),
];

export const knowledgeHandlers = [
  http.get("/api/knowledge/search", ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const kindRaw = url.searchParams.get("kind");
    const materialRaw = url.searchParams.get("material");
    const techniqueRaw = url.searchParams.get("technique");
    const region = url.searchParams.get("region");
    const classificationRaw = url.searchParams.get("classification");
    const standardRaw = url.searchParams.get("standard");
    const productTypeRaw = url.searchParams.get("productType");
    const auctionEligibleRaw = url.searchParams.get("auctionEligible");
    const packId = url.searchParams.get("pack") ?? "metalcraft-studio";
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 50;

    if (kindRaw && !knowledgeChunkKindSchema.safeParse(kindRaw).success) {
      return HttpResponse.json(
        { error: "Invalid kind; use glossary|narrative|ops" },
        { status: 400 }
      );
    }
    if (
      materialRaw &&
      !knowledgeMaterialSchema.safeParse(materialRaw).success
    ) {
      return HttpResponse.json(
        { error: "Invalid material facet" },
        { status: 400 }
      );
    }
    if (
      techniqueRaw &&
      !knowledgeTechniqueSchema.safeParse(techniqueRaw).success
    ) {
      return HttpResponse.json(
        { error: "Invalid technique facet" },
        { status: 400 }
      );
    }
    if (
      classificationRaw &&
      !knowledgeClassificationSchema.safeParse(classificationRaw).success
    ) {
      return HttpResponse.json(
        { error: "Invalid classification facet" },
        { status: 400 }
      );
    }
    let standard: string | undefined;
    if (standardRaw) {
      const std = knowledgeIndustryStandardCodeSchema.safeParse(standardRaw);
      if (!std.success) {
        return HttpResponse.json(
          { error: "Invalid industry standard code" },
          { status: 400 }
        );
      }
      standard = std.data;
    }
    if (
      productTypeRaw &&
      !knowledgeProductTypeSchema.safeParse(productTypeRaw).success
    ) {
      return HttpResponse.json(
        { error: "Invalid productType facet" },
        { status: 400 }
      );
    }
    if (
      auctionEligibleRaw !== null &&
      !["true", "false", "1", "0"].includes(auctionEligibleRaw)
    ) {
      return HttpResponse.json(
        { error: "Invalid auctionEligible; use true|false" },
        { status: 400 }
      );
    }
    const auctionEligible =
      auctionEligibleRaw === "true" || auctionEligibleRaw === "1"
        ? true
        : undefined;

    let rows = FIXTURE_CHUNKS;
    if (kindRaw) rows = rows.filter((c) => c.kind === kindRaw);
    if (materialRaw) {
      rows = rows.filter((c) =>
        c.facets.materials.includes(materialRaw as never)
      );
    }
    if (techniqueRaw) {
      rows = rows.filter((c) =>
        c.facets.techniques.includes(techniqueRaw as never)
      );
    }
    if (region) {
      const r = region.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.facets.regions.length === 0 ||
          c.facets.regions.map((x) => x.toLowerCase()).includes(r)
      );
    }
    if (classificationRaw) {
      rows = rows.filter((c) => c.facets.classification === classificationRaw);
    }
    if (standard) {
      rows = rows.filter((c) => standardsMatch(c.facets.standards, standard));
    }
    if (productTypeRaw) {
      rows = rows.filter((c) =>
        c.facets.productTypes.includes(productTypeRaw as never)
      );
    }
    if (auctionEligible) {
      rows = rows.filter((c) => c.facets.auctionEligible);
    }
    if (q) {
      rows = rows.filter((c) =>
        `${c.title} ${c.text} ${c.tags.join(" ")} ${c.facets.standards.join(" ")}`
          .toLowerCase()
          .includes(q)
      );
    }

    if (Number.isFinite(limit) && limit > 0) {
      rows = rows.slice(0, Math.min(limit, 50));
    }

    const materials = new Set<string>();
    const techniques = new Set<string>();
    const regions = new Set<string>();
    const classifications = new Set<string>();
    const kinds = new Set<string>();
    const standards = new Set<string>();
    const productTypes = new Set<string>();
    let auctionEligibleAgg = false;
    for (const c of rows) {
      kinds.add(c.kind);
      classifications.add(c.facets.classification);
      for (const m of c.facets.materials) materials.add(m);
      for (const t of c.facets.techniques) techniques.add(t);
      for (const r of c.facets.regions) regions.add(r);
      for (const s of c.facets.standards) standards.add(s);
      for (const p of c.facets.productTypes) productTypes.add(p);
      if (c.facets.auctionEligible) auctionEligibleAgg = true;
    }

    const body = knowledgeSearchResponseSchema.parse({
      data: rows,
      total: rows.length,
      packId,
      facets: {
        materials: [...materials].sort(),
        techniques: [...techniques].sort(),
        regions: [...regions].sort(),
        classifications: [...classifications].sort(),
        kinds: [...kinds].sort(),
        standards: [...standards].sort(),
        productTypes: [...productTypes].sort(),
        auctionEligible: auctionEligibleAgg,
      },
    });
    return HttpResponse.json(body);
  }),
];
