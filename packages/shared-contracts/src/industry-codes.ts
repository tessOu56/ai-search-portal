/**
 * Canonical precious-metal / craft industry codes (hallmarks, karat, assay).
 * Shared by portal knowledge search and mirrored metalcraft contracts.
 */

import { z } from "zod";

/** Mirrors knowledgeMaterialSchema values — kept local to avoid circular imports. */
type KnowledgeMaterial =
  | "sterling_silver"
  | "fine_silver"
  | "gold"
  | "copper"
  | "brass"
  | "bronze"
  | "mixed"
  | "other";

/** Mirrors knowledgeProductTypeSchema — local to avoid circular imports. */
type KnowledgeProductType =
  "experience" | "physical" | "material" | "tool" | "venue_rental";

export type IndustryStandardEntry = {
  /** Canonical code stored on chunk facets.standards */
  code: string;
  /** Alternate spellings accepted in query params / search haystacks */
  aliases: string[];
  /** Primary material this mark typically applies to */
  material: KnowledgeMaterial;
  labelEn: string;
  labelZhTw: string;
  /** Optional short family: purity | karat | platinum */
  family: "purity" | "karat" | "platinum" | "other";
};

/** Curated industry code table — expand here, not ad-hoc in UI. */
export const INDUSTRY_STANDARD_REGISTRY: readonly IndustryStandardEntry[] = [
  {
    code: "925",
    aliases: ["Ag925", "sterling", "sterling_silver"],
    material: "sterling_silver",
    labelEn: "Sterling silver 925",
    labelZhTw: "925 銀",
    family: "purity",
  },
  {
    code: "999",
    aliases: ["Ag999", "fine", "fine_silver"],
    material: "fine_silver",
    labelEn: "Fine silver 999",
    labelZhTw: "純銀 999",
    family: "purity",
  },
  {
    code: "958",
    aliases: ["Britannia", "Ag958"],
    material: "sterling_silver",
    labelEn: "Britannia silver 958",
    labelZhTw: "Britannia 958",
    family: "purity",
  },
  {
    code: "800",
    aliases: ["Ag800"],
    material: "sterling_silver",
    labelEn: "Coin silver 800",
    labelZhTw: "800 銀",
    family: "purity",
  },
  {
    code: "10K",
    aliases: ["Au417", "417", "10k"],
    material: "gold",
    labelEn: "10 karat gold",
    labelZhTw: "10K 金",
    family: "karat",
  },
  {
    code: "14K",
    aliases: ["Au585", "585", "14k"],
    material: "gold",
    labelEn: "14 karat gold",
    labelZhTw: "14K 金",
    family: "karat",
  },
  {
    code: "18K",
    aliases: ["Au750", "750", "18k"],
    material: "gold",
    labelEn: "18 karat gold",
    labelZhTw: "18K 金",
    family: "karat",
  },
  {
    code: "22K",
    aliases: ["Au916", "916", "22k"],
    material: "gold",
    labelEn: "22 karat gold",
    labelZhTw: "22K 金",
    family: "karat",
  },
  {
    code: "24K",
    aliases: ["Au999", "999Au", "24k"],
    material: "gold",
    labelEn: "24 karat gold (fine)",
    labelZhTw: "24K 純金",
    family: "karat",
  },
  {
    code: "950",
    aliases: ["Pt950", "platinum950"],
    material: "other",
    labelEn: "Platinum 950",
    labelZhTw: "鉑金 950",
    family: "platinum",
  },
  {
    code: "900",
    aliases: ["Pt900", "platinum900"],
    material: "other",
    labelEn: "Platinum 900",
    labelZhTw: "鉑金 900",
    family: "platinum",
  },
] as const;

const aliasIndex: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const entry of INDUSTRY_STANDARD_REGISTRY) {
    map.set(entry.code.toLowerCase(), entry.code);
    for (const alias of entry.aliases) {
      map.set(alias.toLowerCase(), entry.code);
    }
  }
  return map;
})();

/** Resolve user/query token to canonical industry code, or undefined. */
export function normalizeIndustryStandard(
  raw: string | undefined | null
): string | undefined {
  if (!raw?.trim()) return undefined;
  return aliasIndex.get(raw.trim().toLowerCase());
}

/** True if chunk standards (or aliases) match the requested standard. */
export function standardsMatch(
  chunkStandards: readonly string[],
  requested: string
): boolean {
  const canonical = normalizeIndustryStandard(requested) ?? requested;
  const want = new Set(
    [
      canonical,
      ...(INDUSTRY_STANDARD_REGISTRY.find((e) => e.code === canonical)
        ?.aliases ?? []),
    ].map((s) => s.toLowerCase())
  );
  return chunkStandards.some((s) => {
    const c = normalizeIndustryStandard(s) ?? s;
    return want.has(s.toLowerCase()) || want.has(c.toLowerCase());
  });
}

export function listIndustryStandards(
  family?: IndustryStandardEntry["family"]
) {
  if (!family) return [...INDUSTRY_STANDARD_REGISTRY];
  return INDUSTRY_STANDARD_REGISTRY.filter((e) => e.family === family);
}

function inferMaterialFromHay(hay: string): KnowledgeMaterial | undefined {
  if (/sterling|925\s*銀|純銀/.test(hay)) return "sterling_silver";
  if (/\bgold\b|黃金|純金/.test(hay)) return "gold";
  if (/\bcopper\b|黃銅|紅銅|銅/.test(hay) && !/bronze|青銅/.test(hay)) {
    return "copper";
  }
  if (/bronze|青銅/.test(hay)) return "bronze";
  return undefined;
}

function inferProductTypeFromHay(
  hay: string
): KnowledgeProductType | undefined {
  if (/場地.?租|台租|venue_?rental|半日台|鍛造台租/.test(hay)) {
    return "venue_rental";
  }
  if (/體驗課|體驗產品|入門體驗|鍛造體驗|\bexperience\b/.test(hay)) {
    return "experience";
  }
  if (/銀板|材料包|原材料|材料產品/.test(hay)) return "material";
  if (/鎚組|工具組|平鎚|台座鎚|\btool\b/.test(hay)) return "tool";
  if (/實體作品|實體商品|孤品|\bphysical\b|手鐲/.test(hay)) return "physical";
  return undefined;
}

/**
 * Infer material / standard / commerce facets from free text (chat query, search box).
 * Longer alias tokens win to avoid "9" matching inside "925".
 */
export function inferIndustryFacetsFromText(text: string): {
  material?: KnowledgeMaterial;
  standard?: string;
  productType?: KnowledgeProductType;
  auctionEligible?: boolean;
} {
  const hay = text.trim().toLowerCase();
  if (!hay) return {};

  const candidates: Array<{
    code: string;
    material: KnowledgeMaterial;
    len: number;
  }> = [];
  for (const entry of INDUSTRY_STANDARD_REGISTRY) {
    const tokens = [entry.code, ...entry.aliases];
    for (const token of tokens) {
      const t = token.toLowerCase();
      if (t.length >= 2 && hay.includes(t)) {
        candidates.push({
          code: entry.code,
          material: entry.material,
          len: t.length,
        });
      }
    }
  }

  let material: KnowledgeMaterial | undefined;
  let standard: string | undefined;
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.len - a.len);
    const best = candidates[0];
    standard = best.code;
    material = best.material;
  } else {
    material = inferMaterialFromHay(hay);
  }

  const productType = inferProductTypeFromHay(hay);
  const auctionEligible = /孤品|拍賣|限時拍|可拍賣|auction/.test(hay)
    ? true
    : undefined;

  const out: {
    material?: KnowledgeMaterial;
    standard?: string;
    productType?: KnowledgeProductType;
    auctionEligible?: boolean;
  } = {};
  if (material) out.material = material;
  if (standard) out.standard = standard;
  if (productType) out.productType = productType;
  if (auctionEligible) out.auctionEligible = true;
  return out;
}

export const knowledgeIndustryStandardCodeSchema = z
  .string()
  .min(1)
  .refine((v) => normalizeIndustryStandard(v) !== undefined, {
    message: "Unknown industry standard code",
  })
  .transform((v) => {
    const code = normalizeIndustryStandard(v);
    if (!code) {
      throw new Error("Unknown industry standard code");
    }
    return code;
  });

export type KnowledgeIndustryStandardCode = z.infer<
  typeof knowledgeIndustryStandardCodeSchema
>;
