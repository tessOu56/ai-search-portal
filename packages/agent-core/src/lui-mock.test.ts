import { describe, expect, it } from "vitest";

import { buildLuiResponse } from "./lui-mock.js";
import type { LocalDoc } from "./rag/local-store.js";

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
      packId: "metalcraft-studio",
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
      packId: "metalcraft-studio",
    });

    const cited = response.sources.find((s) => s.title === hit.title);
    expect(cited?.source).toBeUndefined();
  });
});
