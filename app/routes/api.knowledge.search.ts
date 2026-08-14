import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import {
  parsePackIdFromRequest,
  resolveActivePackId,
  sanitizePackId,
} from "~/services/context-pack.server";
import { searchKnowledge } from "~/services/knowledge-search.server";
import {
  knowledgeChunkKindSchema,
  knowledgeClassificationSchema,
  knowledgeIndustryStandardCodeSchema,
  knowledgeMaterialSchema,
  knowledgeProductTypeSchema,
  knowledgeSearchQuerySchema,
  knowledgeTechniqueSchema,
} from "~/shared/contracts";

function parseOptionalEnum<T extends string>(
  raw: string | null,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }
): { ok: true; value?: T } | { ok: false; error: string } {
  if (!raw) return { ok: true, value: undefined };
  const parsed = schema.safeParse(raw);
  if (!parsed.success || parsed.data === undefined) {
    return { ok: false, error: `Invalid value: ${raw}` };
  }
  return { ok: true, value: parsed.data };
}

function invalid(message: string, status = 400) {
  return { ok: false as const, response: json({ error: message }, { status }) };
}

function parseEnumOrInvalid<T extends string>(
  raw: string | null,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T } },
  error: string
) {
  const parsed = parseOptionalEnum(raw, schema);
  if (!parsed.ok) return invalid(error);
  return { ok: true as const, value: parsed.value };
}

function parseStandardAuctionPack(url: URL) {
  const standardRaw = url.searchParams.get("standard");
  let standard: string | undefined;
  if (standardRaw) {
    const std = knowledgeIndustryStandardCodeSchema.safeParse(standardRaw);
    if (!std.success) return invalid("Invalid industry standard code");
    standard = std.data;
  }

  const auctionEligibleRaw = url.searchParams.get("auctionEligible");
  if (
    auctionEligibleRaw !== null &&
    !["true", "false", "1", "0"].includes(auctionEligibleRaw)
  ) {
    return invalid("Invalid auctionEligible; use true|false");
  }

  const packRaw = url.searchParams.get("pack");
  if (packRaw && !sanitizePackId(packRaw)) {
    return invalid("Invalid pack id");
  }

  return {
    ok: true as const,
    standard,
    auctionEligibleRaw,
    packRaw,
  };
}

function parseKnowledgeSearchParams(url: URL) {
  const kind = parseEnumOrInvalid(
    url.searchParams.get("kind"),
    knowledgeChunkKindSchema,
    "Invalid kind; use glossary|narrative|ops"
  );
  if (!kind.ok) return kind;

  const material = parseEnumOrInvalid(
    url.searchParams.get("material"),
    knowledgeMaterialSchema,
    "Invalid material facet"
  );
  if (!material.ok) return material;

  const technique = parseEnumOrInvalid(
    url.searchParams.get("technique"),
    knowledgeTechniqueSchema,
    "Invalid technique facet"
  );
  if (!technique.ok) return technique;

  const classification = parseEnumOrInvalid(
    url.searchParams.get("classification"),
    knowledgeClassificationSchema,
    "Invalid classification facet"
  );
  if (!classification.ok) return classification;

  const productType = parseEnumOrInvalid(
    url.searchParams.get("productType"),
    knowledgeProductTypeSchema,
    "Invalid productType facet"
  );
  if (!productType.ok) return productType;

  const extra = parseStandardAuctionPack(url);
  if (!extra.ok) return extra;

  const parsed = knowledgeSearchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    pack: sanitizePackId(extra.packRaw) ?? undefined,
    kind: kind.value,
    material: material.value,
    technique: technique.value,
    region: url.searchParams.get("region") ?? undefined,
    classification: classification.value,
    standard: extra.standard,
    productType: productType.value,
    auctionEligible: extra.auctionEligibleRaw ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) return invalid("Invalid query");
  return { ok: true as const, data: parsed.data };
}

export function loader({ request }: LoaderFunctionArgs) {
  const parsedParams = parseKnowledgeSearchParams(new URL(request.url));
  if (!parsedParams.ok) return parsedParams.response;

  const packId =
    parsedParams.data.pack ??
    resolveActivePackId({
      packQuery: null,
      cookieHeader: request.headers.get("Cookie"),
      envPack: process.env.CONTEXT_PACK ?? null,
    }) ??
    parsePackIdFromRequest(request);

  try {
    const body = searchKnowledge({
      q: parsedParams.data.q,
      packId,
      kind: parsedParams.data.kind,
      material: parsedParams.data.material,
      technique: parsedParams.data.technique,
      region: parsedParams.data.region,
      classification: parsedParams.data.classification,
      standard: parsedParams.data.standard,
      productType: parsedParams.data.productType,
      auctionEligible: parsedParams.data.auctionEligible,
      limit: parsedParams.data.limit,
    });
    return json(body);
  } catch {
    return json({ error: "Knowledge search failed" }, { status: 500 });
  }
}
