import { describe, expect, it } from "vitest";

import {
  loadPackDocs,
  resolveRagCorpus,
  retrieveLocal,
} from "./local-store.js";
import { runLocalRag, runRagPipelineEvents } from "./pipeline.js";

const PACK_ID = "metalcraft-studio";
const ECOSYSTEM_GLOSSARY_PACK_ID = "ecosystem-glossary";
const INCLUDE_DEFAULTS_OFF = { includeDefaults: false as const };
const TERM_ONE_OFF = "term-one-off";

describe("runRagPipelineEvents local mode", () => {
  it("retrieves matching docs when AGENT_RAG_MODE=local", async () => {
    const prev = process.env.AGENT_RAG_MODE;
    const prevPack = process.env.AGENT_RAG_PACK;
    process.env.AGENT_RAG_MODE = "local";
    delete process.env.AGENT_RAG_PACK;
    const details: string[] = [];
    for await (const ev of runRagPipelineEvents("authentication OAuth", {
      includeDefaults: true,
      packId: null,
    })) {
      if (ev.event === "internal.rag_step") {
        const p = JSON.parse(ev.data) as { detail?: string };
        details.push(p.detail ?? "");
      }
    }
    process.env.AGENT_RAG_MODE = prev;
    if (prevPack === undefined) delete process.env.AGENT_RAG_PACK;
    else process.env.AGENT_RAG_PACK = prevPack;
    expect(details.some((d) => d.includes("auth-1"))).toBe(true);
  });

  it("indexes metalcraft-studio glossary terms", () => {
    const prev = process.env.AGENT_RAG_MODE;
    process.env.AGENT_RAG_MODE = "local";
    const docs = loadPackDocs(PACK_ID);
    expect(docs.some((d) => d.id === TERM_ONE_OFF)).toBe(true);

    const hits = retrieveLocal("孤品", {
      packId: PACK_ID,
      ...INCLUDE_DEFAULTS_OFF,
    });
    // Glossary + auction-eligible narrative both match; commerce boost may rank product first.
    expect(
      hits.some(
        (h) => h.id === TERM_ONE_OFF || h.facets?.auctionEligible === true
      )
    ).toBe(true);
    expect(
      hits[0]?.id === TERM_ONE_OFF || hits[0]?.facets?.auctionEligible
    ).toBe(true);

    const hallmark = retrieveLocal("什麼是 Au750", {
      packId: PACK_ID,
      ...INCLUDE_DEFAULTS_OFF,
    });
    expect(
      hallmark.some(
        (h) =>
          h.id === "term-18k-gold" ||
          h.facets?.standards?.some((s) => s === "18K" || s === "Au750")
      )
    ).toBe(true);

    const auction = retrieveLocal("孤品拍賣", {
      packId: PACK_ID,
      ...INCLUDE_DEFAULTS_OFF,
    });
    expect(
      auction.some(
        (h) => h.facets?.auctionEligible === true || h.id === TERM_ONE_OFF
      )
    ).toBe(true);
    expect(
      auction[0]?.facets?.auctionEligible === true ||
        auction[0]?.id === TERM_ONE_OFF
    ).toBe(true);

    const experience = retrieveLocal("銀戒鍛造入門體驗", {
      packId: PACK_ID,
      ...INCLUDE_DEFAULTS_OFF,
    });
    expect(
      experience.some((h) => h.facets?.productTypes?.includes("experience"))
    ).toBe(true);

    const rag = runLocalRag("底價 reserve", {
      packId: PACK_ID,
      ...INCLUDE_DEFAULTS_OFF,
    });
    expect(rag.hits.some((h) => h.id === "term-reserve-price")).toBe(true);
    expect(rag.output.hits[0]?.kind).toBe("glossary");

    process.env.AGENT_RAG_MODE = prev;
  });
});

describe("ecosystem glossary (T-2026-071)", () => {
  it("has terms with a source citation, synced from platform-command specs/domain", () => {
    const docs = loadPackDocs(ECOSYSTEM_GLOSSARY_PACK_ID);
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.every((d) => d.kind === "glossary")).toBe(true);
    const ssot = docs.find((d) => d.id === "eco-ssot");
    expect(ssot?.source).toBe(
      "platform-command:specs/domain/engineering.yaml#ssot"
    );
  });

  it("is merged into every pack's RAG corpus by default (includeDefaults)", () => {
    const { docs } = resolveRagCorpus({ packId: PACK_ID });
    expect(docs.some((d) => d.id.startsWith("eco-"))).toBe(true);

    const noPack = resolveRagCorpus({ packId: null });
    expect(noPack.docs.some((d) => d.id.startsWith("eco-"))).toBe(true);
  });

  it("is excluded when includeDefaults is false", () => {
    const { docs } = resolveRagCorpus({
      packId: PACK_ID,
      includeDefaults: false,
    });
    expect(docs.some((d) => d.id.startsWith("eco-"))).toBe(false);
  });

  it("surfaces its source through runLocalRag hits when a glossary term matches", () => {
    const prev = process.env.AGENT_RAG_MODE;
    process.env.AGENT_RAG_MODE = "local";
    const { hits } = runLocalRag("single source of truth SSOT", {
      packId: PACK_ID,
    });
    const ssotHit = hits.find((h) => h.id === "eco-ssot");
    expect(ssotHit?.source).toBe(
      "platform-command:specs/domain/engineering.yaml#ssot"
    );
    process.env.AGENT_RAG_MODE = prev;
  });
});
