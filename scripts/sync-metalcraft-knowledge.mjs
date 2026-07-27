#!/usr/bin/env node
/**
 * Idempotent sync: metalcraft-platform seed → portal metalcraft-studio narrative.json
 *
 * Usage (from ai-search-portal root):
 *   pnpm run sync:metalcraft-knowledge
 *
 * Looks for ../metalcraft-platform/packages/contracts/src/fixtures/seed.ts
 * via dynamic import of the built contracts package, or falls back to reading
 * a JSON snapshot if METALCRAFT_SEED_JSON is set.
 *
 * Coverage report (stderr + summary): missing facets / refs / standards on
 * product narrative entries vs seed.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const portalRoot = path.resolve(__dirname, "..");
const packDir = path.join(
  portalRoot,
  "content/context-packs/metalcraft-studio"
);
const narrativePath = path.join(packDir, "narrative.json");

const METALCRAFT_ROOT = path.resolve(
  process.env.METALCRAFT_ROOT ?? path.join(portalRoot, "..", "metalcraft-platform")
);

function loadExistingNarrative() {
  if (!existsSync(narrativePath)) return [];
  return JSON.parse(readFileSync(narrativePath, "utf-8"));
}

function entryFromStudio(studio) {
  return {
    id: `narr-${studio.id}`,
    title: studio.name,
    summary: `${studio.city}${studio.district}金工工作室。${studio.tagline ?? ""}`.trim(),
    entityType: "studio",
    tags: ["studio", studio.regionCode, studio.city].filter(Boolean),
    refs: [studio.id],
    facets: {
      materials: [],
      techniques: ["forging"],
      regions: [studio.regionCode].filter(Boolean),
      classification: "general",
      locale: "zh-TW",
      standards: [],
      productTypes: [],
      auctionEligible: false,
    },
  };
}

function entryFromDesigner(designer) {
  return {
    id: `narr-${designer.id}`,
    title: designer.displayName,
    summary: designer.bio,
    entityType: "designer",
    tags: ["designer", designer.specialty, designer.regionCode].filter(Boolean),
    refs: [designer.id, designer.studioId].filter(Boolean),
    facets: {
      materials: ["sterling_silver"],
      techniques: ["forging"],
      regions: [designer.regionCode].filter(Boolean),
      classification: "general",
      locale: "zh-TW",
      standards: [],
      productTypes: [],
      auctionEligible: false,
    },
  };
}

function inferProductMaterials(product) {
  if (product.productType === "material" || product.productType === "experience") {
    return ["sterling_silver"];
  }
  const title = typeof product.title === "string" ? product.title : "";
  if (title.includes("銅")) return ["copper"];
  if (title.includes("銀") || /sterling/i.test(title)) return ["sterling_silver"];
  return ["mixed"];
}

function richerArray(prev = [], next = []) {
  return next.length > 0 ? next : prev;
}

function preferClassification(prev, next) {
  const curated = new Set([
    "experience",
    "material",
    "auction",
    "technique",
    "provenance",
    "studio_ops",
  ]);
  if (prev && curated.has(prev) && (next === "commerce" || next === "general")) {
    return prev;
  }
  return next ?? prev ?? "general";
}

function entryFromProduct(product) {
  const materials = inferProductMaterials(product);
  const standards = materials.includes("sterling_silver") ? ["925"] : [];
  return {
    id: `narr-${product.id}`,
    title: product.title,
    summary: `${product.summary} (${product.productType}; ${product.price} ${product.currency})`,
    entityType: "product",
    tags: ["product", product.productType].filter(Boolean),
    refs: [product.id, product.studioId, product.designerId].filter(Boolean),
    facets: {
      materials,
      techniques: ["forging"],
      regions: [],
      classification: product.auctionEligible ? "auction" : "commerce",
      locale: "zh-TW",
      standards,
      productTypes: [product.productType],
      auctionEligible: Boolean(product.auctionEligible),
    },
  };
}

async function loadSeedFromMetalcraft() {
  if (process.env.METALCRAFT_SEED_JSON) {
    return JSON.parse(readFileSync(process.env.METALCRAFT_SEED_JSON, "utf-8"));
  }

  // Prefer JSON snapshot (Node ESM + tsc extensionless imports are fragile).
  const jsonFallback = path.join(
    METALCRAFT_ROOT,
    "packages/contracts/src/fixtures/seed-snapshot.json"
  );
  if (existsSync(jsonFallback)) {
    return JSON.parse(readFileSync(jsonFallback, "utf-8"));
  }

  const distSeed = path.join(
    METALCRAFT_ROOT,
    "packages/contracts/dist/fixtures/seed.js"
  );

  if (existsSync(distSeed)) {
    try {
      const mod = await import(pathToFileURL(distSeed).href);
      const bundle = mod.seedBundle ?? mod.default?.seedBundle;
      if (bundle) return bundle;
    } catch (err) {
      console.warn(
        `sync:metalcraft-knowledge: dist seed import failed (${err.message})`
      );
    }
  }

  console.warn(
    `sync:metalcraft-knowledge: metalcraft seed not found at ${METALCRAFT_ROOT}; keeping existing narrative.json`
  );
  return null;
}

function mergeById(existing, incoming) {
  const map = new Map(existing.map((e) => [e.id, e]));
  for (const entry of incoming) {
    const prev = map.get(entry.id);
    if (!prev) {
      map.set(entry.id, entry);
      continue;
    }
    map.set(entry.id, {
      ...entry,
      // Pack copy stays curated when present; seed fills gaps only.
      title: prev.title || entry.title,
      summary: prev.summary || entry.summary,
      tags:
        (prev.tags?.length ?? 0) > 0 ? prev.tags : entry.tags,
      facets: {
        ...(entry.facets ?? {}),
        materials: richerArray(prev.facets?.materials, entry.facets?.materials),
        techniques: richerArray(
          prev.facets?.techniques,
          entry.facets?.techniques
        ),
        regions: richerArray(prev.facets?.regions, entry.facets?.regions),
        standards: richerArray(prev.facets?.standards, entry.facets?.standards),
        productTypes:
          entry.facets?.productTypes?.length > 0
            ? entry.facets.productTypes
            : prev.facets?.productTypes ?? [],
        auctionEligible:
          typeof entry.facets?.auctionEligible === "boolean"
            ? entry.facets.auctionEligible
            : Boolean(prev.facets?.auctionEligible),
        classification: preferClassification(
          prev.facets?.classification,
          entry.facets?.classification
        ),
        locale: prev.facets?.locale ?? entry.facets?.locale ?? "zh-TW",
      },
    });
  }
  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function reportCommerceDrift(entries, seed) {
  const drifts = [];
  for (const product of seed?.products ?? []) {
    const narr = entries.find((e) => e.id === `narr-${product.id}`);
    if (!narr) {
      drifts.push(`${product.id}: missing narrative`);
      continue;
    }
    const pt = narr.facets?.productTypes?.[0];
    if (pt !== product.productType) {
      drifts.push(
        `${product.id}: productType “${pt ?? "∅"}” ≠ seed “${product.productType}”`
      );
    }
    if (Boolean(narr.facets?.auctionEligible) !== Boolean(product.auctionEligible)) {
      drifts.push(
        `${product.id}: auctionEligible ${Boolean(narr.facets?.auctionEligible)} ≠ seed ${Boolean(product.auctionEligible)}`
      );
    }
  }
  console.log(
    `commerce drift vs seed: ${drifts.length}${drifts.length ? `\n  - ${drifts.join("\n  - ")}` : ""}`
  );
  return drifts.length;
}

function reportCoverage(entries, seed) {
  const products = seed?.products ?? [];
  const seedIds = new Set(products.map((p) => `narr-${p.id}`));
  const productEntries = entries.filter((e) => e.entityType === "product");

  const missingSeed = products
    .map((p) => `narr-${p.id}`)
    .filter((id) => !entries.some((e) => e.id === id));

  const missingProductType = productEntries.filter(
    (e) => !e.facets?.productTypes?.length
  );
  const missingAuctionFlag = productEntries.filter(
    (e) => typeof e.facets?.auctionEligible !== "boolean"
  );
  const missingRefs = productEntries.filter((e) => !e.refs?.length);
  const missingStandards = productEntries.filter(
    (e) =>
      (e.facets?.materials ?? []).includes("sterling_silver") &&
      !(e.facets?.standards ?? []).length
  );
  const orphanProducts = productEntries.filter((e) => !seedIds.has(e.id));
  const commerceDrift = reportCommerceDrift(entries, seed);

  const lines = [
    "--- sync coverage ---",
    `narrative entries: ${entries.length}`,
    `product entries: ${productEntries.length} (seed products: ${products.length})`,
    `missing seed→narrative: ${missingSeed.length}${missingSeed.length ? ` [${missingSeed.join(", ")}]` : ""}`,
    `products without productTypes: ${missingProductType.length}`,
    `products without auctionEligible bool: ${missingAuctionFlag.length}`,
    `products without refs: ${missingRefs.length}`,
    `sterling products without standards: ${missingStandards.length}`,
    `narrative products not in seed: ${orphanProducts.length}`,
    "---------------------",
  ];
  for (const line of lines) console.log(line);

  return {
    missingSeed: missingSeed.length,
    missingProductType: missingProductType.length,
    missingAuctionFlag: missingAuctionFlag.length,
    missingRefs: missingRefs.length,
    missingStandards: missingStandards.length,
    commerceDrift,
  };
}

async function main() {
  mkdirSync(packDir, { recursive: true });
  const existing = loadExistingNarrative();
  const seed = await loadSeedFromMetalcraft();
  const checkOnly = process.env.CHECK_ONLY === "1" || process.argv.includes("--check");

  if (checkOnly) {
    console.log("sync:metalcraft-knowledge: CHECK_ONLY (no write)");
    const coverage = reportCoverage(existing, seed);
    const failed =
      coverage.missingSeed > 0 ||
      coverage.missingProductType > 0 ||
      coverage.missingAuctionFlag > 0 ||
      coverage.commerceDrift > 0;
    if (failed) {
      console.error("sync:metalcraft-knowledge: coverage/drift check FAILED");
      process.exit(1);
    }
    console.log("sync:metalcraft-knowledge: coverage/drift check OK");
    return;
  }

  if (!seed) {
    writeFileSync(narrativePath, `${JSON.stringify(existing, null, 2)}\n`);
    console.log(
      `sync:metalcraft-knowledge: wrote ${existing.length} existing narrative entries (no seed merge)`
    );
    reportCoverage(existing, null);
    return;
  }

  const fromSeed = [
    ...(seed.studios ?? []).map(entryFromStudio),
    ...(seed.designers ?? []).map(entryFromDesigner),
    ...(seed.products ?? []).map(entryFromProduct),
  ];

  const merged = mergeById(existing, fromSeed);
  writeFileSync(narrativePath, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(
    `sync:metalcraft-knowledge: merged ${fromSeed.length} seed entities → ${merged.length} narrative entries`
  );
  const coverage = reportCoverage(merged, seed);
  if (
    coverage.missingSeed > 0 ||
    coverage.missingProductType > 0 ||
    coverage.missingAuctionFlag > 0 ||
    coverage.commerceDrift > 0
  ) {
    console.warn(
      "sync:metalcraft-knowledge: coverage gaps remain (see report above)"
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
