/**
 * Context pack file loader — domain-neutral; reads content/context-packs/*.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  type ContextGlossaryTermContract,
  contextGlossaryTermSchema,
  type ContextMetricContract,
  contextMetricSchema,
  type ContextPackManifestContract,
  contextPackManifestSchema,
  DEFAULT_CONTEXT_PACK_ID,
  type DomainBindingContract,
  domainBindingsFileSchema,
  type KnowledgeGlossaryEntryContract,
  knowledgeGlossaryEntrySchema,
  type KnowledgeNarrativeEntryContract,
  knowledgeNarrativeEntrySchema,
  type KnowledgeOpsEntryContract,
  knowledgeOpsEntrySchema,
  type MetadataAssetDetailContract,
  metadataAssetDetailSchema,
} from "@ai-search-portal/contracts";

const PACKS_DIR = "content/context-packs";
const CONTEXT_PACK_COOKIE = "context_pack";
const FILE_PACK_JSON = "pack.json";
const FILE_ASSETS_JSON = "assets.json";
const FILE_METRICS_JSON = "metrics.json";
const FILE_GLOSSARY_JSON = "glossary.json";
const FILE_BINDINGS_JSON = "bindings.json";
const FILE_NARRATIVE_JSON = "narrative.json";
const FILE_OPS_JSON = "ops.json";

/**
 * Eager Vite glob so Vercel serverless NFT bundles pack JSON (fs reads alone
 * are invisible to the tracer and return empty corpora in production).
 * Must be a static `import.meta.glob(...)` call — assigning `.glob` to a
 * variable breaks Vite's transform and yields `viteGlob is not a function`.
 * Keys look like: ../../../content/context-packs/<packId>/<file>.json
 */
// Remix's ImportMeta types mark `glob` as an error sentinel; Vite rewrites it.
const BUNDLED_PACK_JSON = (
  import.meta as ImportMeta & {
    glob: (
      pattern: string,
      options: { eager: boolean; import: string }
    ) => Record<string, unknown>;
  }
).glob("../../../content/context-packs/**/*.json", {
  eager: true,
  import: "default",
});

function bundledPackFile(packId: string, fileName: string): unknown {
  const suffix = `/content/context-packs/${packId}/${fileName}`;
  for (const [key, value] of Object.entries(BUNDLED_PACK_JSON)) {
    if (key.endsWith(suffix) || key.includes(`${packId}/${fileName}`)) {
      return value;
    }
  }
  return undefined;
}

function listBundledPackIds(): string[] {
  const ids = new Set<string>();
  const packSuffix = `/content/context-packs/`;
  for (const key of Object.keys(BUNDLED_PACK_JSON)) {
    const idx = key.indexOf(packSuffix);
    if (idx < 0) continue;
    const rest = key.slice(idx + packSuffix.length);
    if (!rest.endsWith(`/${FILE_PACK_JSON}`)) continue;
    const id = rest.slice(0, -`/${FILE_PACK_JSON}`.length);
    if (id && !id.includes("/")) ids.add(id);
  }
  return [...ids].sort();
}

// Pack ids are user-controllable (query/cookie). Restrict to a safe slug so
// they can never traverse outside content/context-packs (e.g. "../../etc").
const SAFE_PACK_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

export function sanitizePackId(
  candidate: string | null | undefined
): string | null {
  const trimmed = candidate?.trim();
  if (!trimmed || !SAFE_PACK_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

type PackCache = {
  assets: Map<string, MetadataAssetDetailContract[]>;
  metrics: Map<string, ContextMetricContract[]>;
  glossary: Map<string, ContextGlossaryTermContract[]>;
  knowledgeGlossary: Map<string, KnowledgeGlossaryEntryContract[]>;
  bindings: Map<string, DomainBindingContract[]>;
  narrative: Map<string, KnowledgeNarrativeEntryContract[]>;
  ops: Map<string, KnowledgeOpsEntryContract[]>;
  manifests: ContextPackManifestContract[] | null;
};

function createPackCache(): PackCache {
  return {
    assets: new Map(),
    metrics: new Map(),
    glossary: new Map(),
    knowledgeGlossary: new Map(),
    bindings: new Map(),
    narrative: new Map(),
    ops: new Map(),
    manifests: null,
  };
}

let cache: PackCache = createPackCache();

function readJsonFile(filePath: string): unknown {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as unknown;
}

function packsRoot(contentRoot: string): string {
  return path.join(contentRoot, PACKS_DIR);
}

function packDir(contentRoot: string, packId: string): string {
  const root = packsRoot(contentRoot);
  // Defense in depth: even a validated id must resolve strictly inside root.
  const dir = path.resolve(root, packId);
  if (!dir.startsWith(root + path.sep)) {
    throw new Error(`Invalid context pack id: ${packId}`);
  }
  return dir;
}

function loadJsonArray<T>(
  filePath: string,
  parseItem: (item: unknown) => T,
  bundled: unknown = undefined
): T[] {
  const data =
    bundled !== undefined
      ? bundled
      : existsSync(filePath)
        ? readJsonFile(filePath)
        : null;
  if (data === null) return [];
  if (!Array.isArray(data)) return [];
  return data.map((item) => parseItem(item));
}

export function resolveContentRoot(cwd = process.cwd()): string {
  const candidates = [
    cwd,
    path.join(cwd, ".."),
    path.join(cwd, "../.."),
    // Vercel serverless often lands under /var/task with nested build dirs.
    path.join(cwd, "build/server"),
    path.join(cwd, "..", "build/server"),
  ];
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, PACKS_DIR))) return candidate;
  }
  return cwd;
}

export function listContextPackIds(contentRoot: string): string[] {
  const fromBundle = listBundledPackIds();
  if (fromBundle.length > 0) return fromBundle;
  const root = packsRoot(contentRoot);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((id) => existsSync(path.join(root, id, FILE_PACK_JSON)));
}

export function listContextPacks(
  contentRoot: string
): ContextPackManifestContract[] {
  if (cache.manifests) return cache.manifests;
  const ids = listContextPackIds(contentRoot);
  const manifests = ids.map((id) => {
    const bundled = bundledPackFile(id, FILE_PACK_JSON);
    if (bundled !== undefined) {
      return contextPackManifestSchema.parse(bundled);
    }
    const manifestPath = path.join(packDir(contentRoot, id), FILE_PACK_JSON);
    return contextPackManifestSchema.parse(readJsonFile(manifestPath));
  });
  cache.manifests = manifests;
  return manifests;
}

export function loadPackAssets(
  packId: string,
  contentRoot: string
): MetadataAssetDetailContract[] {
  const cached = cache.assets.get(packId);
  if (cached) return cached;
  const filePath = path.join(packDir(contentRoot, packId), FILE_ASSETS_JSON);
  const assets = loadJsonArray(
    filePath,
    (item) => metadataAssetDetailSchema.parse(item),
    bundledPackFile(packId, FILE_ASSETS_JSON)
  ).map((asset) => ({
    ...asset,
    packId: asset.packId ?? packId,
  }));
  cache.assets.set(packId, assets);
  return assets;
}

export function loadPackMetrics(
  packId: string,
  contentRoot: string
): ContextMetricContract[] {
  const cached = cache.metrics.get(packId);
  if (cached) return cached;
  const filePath = path.join(packDir(contentRoot, packId), FILE_METRICS_JSON);
  const metrics = loadJsonArray(
    filePath,
    (item) => contextMetricSchema.parse(item),
    bundledPackFile(packId, FILE_METRICS_JSON)
  );
  cache.metrics.set(packId, metrics);
  return metrics;
}

export function loadPackGlossary(
  packId: string,
  contentRoot: string
): ContextGlossaryTermContract[] {
  const cached = cache.glossary.get(packId);
  if (cached) return cached;
  const filePath = path.join(packDir(contentRoot, packId), FILE_GLOSSARY_JSON);
  const terms = loadJsonArray(
    filePath,
    (item) => contextGlossaryTermSchema.parse(item),
    bundledPackFile(packId, FILE_GLOSSARY_JSON)
  );
  cache.glossary.set(packId, terms);
  return terms;
}

/** Enriched glossary with industry facets (knowledge / RAG corpus). */
export function loadPackKnowledgeGlossary(
  packId: string,
  contentRoot: string
): KnowledgeGlossaryEntryContract[] {
  const cached = cache.knowledgeGlossary.get(packId);
  if (cached) return cached;
  const filePath = path.join(packDir(contentRoot, packId), FILE_GLOSSARY_JSON);
  const terms = loadJsonArray(
    filePath,
    (item) => knowledgeGlossaryEntrySchema.parse(item),
    bundledPackFile(packId, FILE_GLOSSARY_JSON)
  );
  cache.knowledgeGlossary.set(packId, terms);
  return terms;
}

export function loadPackBindings(
  packId: string,
  contentRoot: string
): DomainBindingContract[] {
  const cached = cache.bindings.get(packId);
  if (cached) return cached;
  const bundled = bundledPackFile(packId, FILE_BINDINGS_JSON);
  if (bundled !== undefined) {
    const parsed = domainBindingsFileSchema.parse(bundled);
    cache.bindings.set(packId, parsed.bindings);
    return parsed.bindings;
  }
  const filePath = path.join(packDir(contentRoot, packId), FILE_BINDINGS_JSON);
  if (!existsSync(filePath)) {
    cache.bindings.set(packId, []);
    return [];
  }
  const parsed = domainBindingsFileSchema.parse(readJsonFile(filePath));
  cache.bindings.set(packId, parsed.bindings);
  return parsed.bindings;
}

export function loadPackNarrative(
  packId: string,
  contentRoot: string
): KnowledgeNarrativeEntryContract[] {
  const cached = cache.narrative.get(packId);
  if (cached) return cached;
  const filePath = path.join(packDir(contentRoot, packId), FILE_NARRATIVE_JSON);
  const entries = loadJsonArray(
    filePath,
    (item) => knowledgeNarrativeEntrySchema.parse(item),
    bundledPackFile(packId, FILE_NARRATIVE_JSON)
  );
  cache.narrative.set(packId, entries);
  return entries;
}

export function loadPackOps(
  packId: string,
  contentRoot: string
): KnowledgeOpsEntryContract[] {
  const cached = cache.ops.get(packId);
  if (cached) return cached;
  const filePath = path.join(packDir(contentRoot, packId), FILE_OPS_JSON);
  const entries = loadJsonArray(
    filePath,
    (item) => knowledgeOpsEntrySchema.parse(item),
    bundledPackFile(packId, FILE_OPS_JSON)
  );
  cache.ops.set(packId, entries);
  return entries;
}

export function getPackMetric(
  packId: string,
  metricId: string,
  contentRoot: string
): ContextMetricContract | null {
  return (
    loadPackMetrics(packId, contentRoot).find((m) => m.id === metricId) ?? null
  );
}

export function resolveDomainBindings(
  packId: string,
  contextRef: string | undefined,
  contentRoot: string
): DomainBindingContract[] {
  const all = loadPackBindings(packId, contentRoot);
  if (!contextRef) return all;
  return all.filter((b) => b.contextRef === contextRef);
}

function decodeCookieValue(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function resolveActivePackId(args: {
  packQuery?: string | null;
  cookieHeader?: string | null;
  envPack?: string | null;
}): string {
  // Untrusted sources (query, cookie) fall through to the next source when
  // they fail sanitizePackId, so a hostile value can never reach the fs layer.
  const fromQuery = sanitizePackId(args.packQuery);
  if (fromQuery) return fromQuery;

  const cookie = args.cookieHeader ?? "";
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)${CONTEXT_PACK_COOKIE}=([^;]+)`)
  );
  const fromCookie = match?.[1]
    ? sanitizePackId(decodeCookieValue(match[1]))
    : null;
  if (fromCookie) return fromCookie;

  const fromEnv = sanitizePackId(args.envPack);
  if (fromEnv) return fromEnv;

  return DEFAULT_CONTEXT_PACK_ID;
}

export function parsePackIdFromRequest(request: Request): string {
  const url = new URL(request.url);
  return resolveActivePackId({
    packQuery: url.searchParams.get("pack"),
    cookieHeader: request.headers.get("Cookie"),
    envPack: process.env.CONTEXT_PACK ?? null,
  });
}

export function resetContextPackCache(): void {
  cache = createPackCache();
}

export { CONTEXT_PACK_COOKIE, DEFAULT_CONTEXT_PACK_ID };
