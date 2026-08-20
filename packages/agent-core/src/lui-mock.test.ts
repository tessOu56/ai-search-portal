import { describe, expect, it } from "vitest";

import { buildLuiResponse } from "./lui-mock.js";
import type { LocalDoc } from "./rag/local-store.js";

const PACK_ID = "metalcraft-studio";

describe("buildLuiResponse source citation (T-2026-071)", () => {
  it("propagates a glossary hit's `source` onto the matching LuiSource", () => {
    const hit: LocalDoc = {
      id: "eco-ssot",
      title: "Single source of truth (SSOT)",
      kind: "glossary",
      text: "每項資訊指定唯一權威來源，其餘皆為衍生或引用。",
      tags: ["glossary", "ecosystem"],
      refs: [],
      source: "platform-command:specs/domain/engineering.yaml#ssot",
    };

    const response = buildLuiResponse("what is SSOT", {
      ragHits: [hit],
      packId: PACK_ID,
    });

    const cited = response.sources.find((s) => s.title === hit.title);
    expect(cited?.source).toBe(
      "platform-command:specs/domain/engineering.yaml#ssot"
    );
  });

  it("leaves `source` undefined for hits without one (no regression for existing packs)", () => {
    const hit: LocalDoc = {
      id: "term-one-off",
      title: "孤品",
      kind: "glossary",
      text: "獨一無二的作品。",
      tags: ["glossary"],
      refs: [],
    };

    const response = buildLuiResponse("什麼是孤品", {
      ragHits: [hit],
      packId: PACK_ID,
    });

    const cited = response.sources.find((s) => s.title === hit.title);
    expect(cited?.source).toBeUndefined();
  });

  it("uses query-aware PII fixture with metadata evidence links when RAG misses", () => {
    const response = buildLuiResponse(
      "Which datasets contain PII and what access do I need?",
      { packId: PACK_ID }
    );
    expect(response.summary).toMatch(/示範|PII|pii/i);
    expect(response.sources.some((s) => s.url.includes("/metadata"))).toBe(
      true
    );
    expect(response.sources.some((s) => s.url.includes("tbl-customers"))).toBe(
      true
    );
    // Continue CTAs live in UI buttons — not duplicated in sources
    expect(
      response.sources.every(
        (s) =>
          !/continue in catalog|browse metadata/i.test(s.title) &&
          !s.url.includes("/catalog-search")
      )
    ).toBe(true);
    expect(response.sources.every((s) => !s.url.includes("/dishes"))).toBe(
      true
    );
  });
});
