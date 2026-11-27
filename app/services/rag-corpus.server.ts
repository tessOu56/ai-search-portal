import {
  buildPackDocsFromArrays,
  DEFAULT_DOCS,
  type LocalDoc,
  type RetrieveLocalOptions,
} from "@ai-search-portal/agent-core";

import { isWorkersRuntime } from "~/shared/runtime.server";

const ECOSYSTEM_GLOSSARY_PACK_ID = "ecosystem-glossary";

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

function bundledPackFile(packId: string, fileName: string): unknown[] {
  for (const [key, value] of Object.entries(BUNDLED_PACK_JSON)) {
    if (
      key.includes(`/content/context-packs/${packId}/${fileName}`) ||
      key.endsWith(`${packId}/${fileName}`)
    ) {
      return Array.isArray(value) ? value : [];
    }
  }
  return [];
}

function loadBundledPackDocs(packId: string): LocalDoc[] {
  return buildPackDocsFromArrays({
    glossary: bundledPackFile(packId, "glossary.json"),
    narrative: bundledPackFile(packId, "narrative.json"),
    ops: bundledPackFile(packId, "ops.json"),
  });
}

function dedupeById(docs: LocalDoc[]): LocalDoc[] {
  const seen = new Set<string>();
  const out: LocalDoc[] = [];
  for (const doc of docs) {
    const id = String(doc.id);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(doc);
  }
  return out;
}

/**
 * Pre-bundled RAG corpus for Cloudflare Workers (no runtime filesystem).
 * On Node dev, agent-core may still read from disk when this is not passed.
 */
export function bundledRagRetrieveOptions(
  packId?: string | null
): RetrieveLocalOptions | undefined {
  if (!isWorkersRuntime()) return undefined;
  const ecosystemDocs = loadBundledPackDocs(ECOSYSTEM_GLOSSARY_PACK_ID);
  const activePack = packId?.trim() ? packId.trim() : null;
  const packDocs = activePack ? loadBundledPackDocs(activePack) : [];
  const docs =
    packDocs.length > 0
      ? dedupeById([...packDocs, ...ecosystemDocs, ...DEFAULT_DOCS])
      : dedupeById([...DEFAULT_DOCS, ...ecosystemDocs]);
  return {
    docs,
    packId: activePack ?? undefined,
    includeDefaults: false,
  };
}
