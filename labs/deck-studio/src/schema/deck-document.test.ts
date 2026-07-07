import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { DeckDocument, type DeckDocumentT } from "./deck-document.js";

const fixture = DeckDocument.parse(
  JSON.parse(
    readFileSync(
      new URL("../fixtures/resume-interview.json", import.meta.url),
      "utf-8"
    )
  ) as unknown
);

function clone(): DeckDocumentT {
  return structuredClone(fixture);
}

describe("DeckDocument (B0 契約)", () => {
  it("round-trip：fixture 通過驗證且 parse 結果可再次通過", () => {
    const once = DeckDocument.parse(fixture);
    const twice = DeckDocument.parse(structuredClone(once));
    expect(twice.slides).toHaveLength(12);
    expect(twice.meta.lang).toBe("zh-TW");
  });

  it("拒絕：超過 maxSlides", () => {
    const bad = clone();
    bad.constraints.maxSlides = 3;
    expect(DeckDocument.safeParse(bad).success).toBe(false);
  });

  it("拒絕：重複 slide id", () => {
    const bad = clone();
    bad.slides[1].id = bad.slides[0].id;
    expect(DeckDocument.safeParse(bad).success).toBe(false);
  });

  it("拒絕：空 slides", () => {
    expect(DeckDocument.safeParse({ ...fixture, slides: [] }).success).toBe(
      false
    );
  });
});
