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

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const kind = parseOptionalEnum(
    url.searchParams.get("kind"),
    knowledgeChunkKindSchema
  );
  if (!kind.ok) {
    return json(
      { error: "Invalid kind; use glossary|narrative|ops" },
      { status: 400 }
    );
  }

  const material = parseOptionalEnum(
    url.searchParams.get("material"),
    knowledgeMaterialSchema
  );
  if (!material.ok) {
    return json({ error: "Invalid material facet" }, { status: 400 });
  }

  const technique = parseOptionalEnum(
    url.searchParams.get("technique"),
    knowledgeTechniqueSchema
  );
  if (!technique.ok) {
    return json({ error: "Invalid technique facet" }, { status: 400 });
  }

  const classification = parseOptionalEnum(
    url.searchParams.get("classification"),
    knowledgeClassificationSchema
  );
  if (!classification.ok) {
    return json({ error: "Invalid classification facet" }, { status: 400 });
  }

  const standardRaw = url.searchParams.get("standard");
  let standard: string | undefined;
  if (standardRaw) {
    const std = knowledgeIndustryStandardCodeSchema.safeParse(standardRaw);
    if (!std.success) {
      return json({ error: "Invalid industry standard code" }, { status: 400 });
    }
    standard = std.data;
  }

  const productType = parseOptionalEnum(
    url.searchParams.get("productType"),
    knowledgeProductTypeSchema
  );
  if (!productType.ok) {
    return json({ error: "Invalid productType facet" }, { status: 400 });
  }

  const auctionEligibleRaw = url.searchParams.get("auctionEligible");
  if (
    auctionEligibleRaw !== null &&
    !["true", "false", "1", "0"].includes(auctionEligibleRaw)
  ) {
    return json(
      { error: "Invalid auctionEligible; use true|false" },
      { status: 400 }
    );
  }

  const packRaw = url.searchParams.get("pack");
  if (packRaw && !sanitizePackId(packRaw)) {
    return json({ error: "Invalid pack id" }, { status: 400 });
  }

  const parsed = knowledgeSearchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    pack: sanitizePackId(packRaw) ?? undefined,
    kind: kind.value,
    material: material.value,
    technique: technique.value,
    region: url.searchParams.get("region") ?? undefined,
    classification: classification.value,
    standard,
    productType: productType.value,
    auctionEligible: auctionEligibleRaw ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return json({ error: "Invalid query" }, { status: 400 });
  }

  const packId =
    parsed.data.pack ??
    resolveActivePackId({
      packQuery: null,
      cookieHeader: request.headers.get("Cookie"),
      envPack: process.env.CONTEXT_PACK ?? null,
    }) ??
    parsePackIdFromRequest(request);

  try {
    const body = searchKnowledge({
      q: parsed.data.q,
      packId,
      kind: parsed.data.kind,
      material: parsed.data.material,
      technique: parsed.data.technique,
      region: parsed.data.region,
      classification: parsed.data.classification,
      standard: parsed.data.standard,
      productType: parsed.data.productType,
      auctionEligible: parsed.data.auctionEligible,
      limit: parsed.data.limit,
    });
    return json(body);
  } catch {
    return json({ error: "Knowledge search failed" }, { status: 500 });
  }
}
