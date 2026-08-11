#!/usr/bin/env node
/**
 * Idempotent sync: platform-command specs/domain/*.yaml → portal
 * content/context-packs/ecosystem-glossary/glossary.json (T-2026-071).
 *
 * Closes agentic-integration-review.md trend-2 gap ("glossary 未接入 agent
 * context"): terms defined once in platform-command as the ecosystem SSOT
 * become part of the local-RAG corpus (packages/agent-core/src/rag/local-store.ts
 * loads every context pack's glossary.json), so LUI answers can cite them —
 * with a `source` field carrying the originating spec file + term id, surfaced
 * in chat sources (see packages/agent-core/src/lui-mock.ts).
 *
 * Usage (from ai-search-portal root):
 *   pnpm run sync:domain-glossary
 *   pnpm run check:domain-glossary   # CHECK_ONLY=1 — fails if output would change
 *
 * Looks for ../platform-command/specs/domain/*.yaml by default; override with
 * PLATFORM_COMMAND_PATH=/abs/path/to/platform-command.
 *
 * Deterministic + idempotent: terms are sorted by id and the file is only
 * rewritten when content actually changes, so re-running with unchanged
 * source yaml is a no-op (safe for CI / pre-commit).
 *
 * Intentionally has no pack.json: `local-store.ts` (agent-core RAG) loads any
 * `content/context-packs/<id>/glossary.json` by directory name alone, but the
 * Remix app's context-pack-loader.server.ts only lists packs that *do* have a
 * pack.json. This keeps "ecosystem-glossary" out of the user-facing pack
 * switcher (it's an agent-context-only corpus, not a browsable metadata pack)
 * while still being merged into every chat's RAG corpus.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const portalRoot = path.resolve(__dirname, "..");
const PACK_ID = "ecosystem-glossary";
const packDir = path.join(portalRoot, "content/context-packs", PACK_ID);
const glossaryPath = path.join(packDir, "glossary.json");

const PLATFORM_COMMAND_ROOT = path.resolve(
  process.env.PLATFORM_COMMAND_PATH ??
    path.join(portalRoot, "..", "platform-command")
);
const domainSpecDir = path.join(PLATFORM_COMMAND_ROOT, "specs/domain");

const REPO_LABEL = "platform-command";

function listDomainYamlFiles() {
  if (!existsSync(domainSpecDir)) return [];
  return readdirSync(domainSpecDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();
}

function readDomainTerms(fileName) {
  const filePath = path.join(domainSpecDir, fileName);
  const raw = readFileSync(filePath, "utf-8");
  const doc = parseYaml(raw);
  const terms = Array.isArray(doc?.terms) ? doc.terms : [];
  return terms.map((term) => ({ term, fileName }));
}

/** term.related holds sibling term ids (same `eco-` id scheme as this pack). */
function relatedAssetIdsFor(term) {
  const related = Array.isArray(term.related) ? term.related : [];
  return related
    .filter((r) => typeof r === "string" && r.length > 0)
    .map((r) => `eco-${r}`);
}

function definitionFor(term) {
  const base = typeof term.definition === "string" ? term.definition : "";
  const mapsTo =
    typeof term.ecosystem?.maps_to === "string" ? term.ecosystem.maps_to : null;
  const status = typeof term.ecosystem?.status === "string" ? term.ecosystem.status : null;
  const suffix = mapsTo
    ? ` Ecosystem mapping (${status ?? "mapped"}): ${mapsTo}.`
    : "";
  return `${base}${suffix}`.trim();
}

function entryFromTerm({ term, fileName }) {
  if (!term?.id || !term?.name || !term?.definition) return null;
  return {
    id: `eco-${term.id}`,
    term: term.aliases?.length ? `${term.name} (${term.aliases.join(", ")})` : term.name,
    definition: definitionFor(term),
    relatedAssetIds: relatedAssetIdsFor(term),
    tags: ["ecosystem", term.domain, ...(term.aliases ?? [])].filter(Boolean),
    source: `${REPO_LABEL}:specs/domain/${fileName}#${term.id}`,
    facets: {
      materials: [],
      techniques: [],
      regions: [],
      classification: term.domain ?? "ecosystem",
      standards: [],
      productTypes: [],
      auctionEligible: false,
    },
  };
}

function loadExistingGlossary() {
  if (!existsSync(glossaryPath)) return [];
  try {
    return JSON.parse(readFileSync(glossaryPath, "utf-8"));
  } catch {
    return [];
  }
}

function main() {
  const checkOnly =
    process.env.CHECK_ONLY === "1" || process.argv.includes("--check");

  const files = listDomainYamlFiles();
  if (files.length === 0) {
    console.warn(
      `sync:domain-glossary: no domain specs found at ${domainSpecDir}; leaving ${path.relative(portalRoot, glossaryPath)} untouched`
    );
    return;
  }

  const entries = files
    .flatMap(readDomainTerms)
    .map(entryFromTerm)
    .filter((e) => e !== null)
    .sort((a, b) => a.id.localeCompare(b.id));

  const existing = loadExistingGlossary();
  const nextJson = `${JSON.stringify(entries, null, 2)}\n`;
  const existingJson = `${JSON.stringify(existing, null, 2)}\n`;
  const changed = nextJson !== existingJson;

  if (checkOnly) {
    if (changed) {
      console.error(
        `sync:domain-glossary: CHECK_ONLY drift — ${entries.length} synced terms differ from committed glossary.json. Run \`pnpm run sync:domain-glossary\`.`
      );
      process.exit(1);
    }
    console.log(
      `sync:domain-glossary: CHECK_ONLY OK — ${entries.length} terms from ${files.length} spec file(s), no drift`
    );
    return;
  }

  mkdirSync(packDir, { recursive: true });

  if (!changed) {
    console.log(
      `sync:domain-glossary: idempotent — ${entries.length} terms unchanged, skipped write`
    );
    return;
  }

  writeFileSync(glossaryPath, nextJson);
  console.log(
    `sync:domain-glossary: synced ${entries.length} terms from ${files.length} spec file(s) → ${path.relative(portalRoot, glossaryPath)}`
  );
}

main();
