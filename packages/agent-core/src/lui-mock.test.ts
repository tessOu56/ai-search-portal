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
    expect(
      response.nextActions?.some((a) => a.href.includes("tbl-customers"))
    ).toBe(true);
    expect(
      response.nextActions?.some((a) =>
        a.href.includes("purpose=marketing&role=analyst")
      )
    ).toBe(true);
  });

  it("maps talk/event queries to nx event-portal LIVE nextActions", () => {
    const response = buildLuiResponse("哪裡可以報名講座活動？", {
      packId: PACK_ID,
    });
    expect(
      response.nextActions?.some((a) => a.href.includes("nx-event-portal"))
    ).toBe(true);
    expect(
      response.nextActions?.every((a) => !a.href.includes("/api/dishes"))
    ).toBe(true);
  });

  it("maps auction queries to Plinth LIVE nextActions", () => {
    const response = buildLuiResponse("拍賣拍品在哪裡出價？", {
      packId: PACK_ID,
    });
    expect(
      response.nextActions?.some((a) =>
        a.href.includes("metalcraft-storefront-eta.vercel.app")
      )
    ).toBe(true);
  });

  it("keeps food queries on loader dishes/recipes without fake REST", () => {
    const response = buildLuiResponse("有沒有食譜 API？", { packId: PACK_ID });
    expect(response.answer).toMatch(/loader|沒有 REST|honest|示範殼/i);
    expect(response.nextActions?.some((a) => a.href === "/dishes")).toBe(true);
    expect(response.nextActions?.some((a) => a.href === "/recipes")).toBe(true);
    expect(
      response.nextActions?.some((a) =>
        a.href.includes("vue-motion-sandbox/recipes")
      )
    ).toBe(true);
    expect(
      response.nextActions?.every(
        (a) =>
          !a.href.includes("/api/dishes") && !a.href.includes("/api/recipes")
      )
    ).toBe(true);
  });
});
