import { describe, expect, it } from "vitest";

import { EXPERIENCE_NAV, experienceNavIsActive } from "./experience-nav";

const DICTIONARY_HREF = "/catalog-search/dictionary";

describe("experience nav", () => {
  it("never lists create, param, or planning paths", () => {
    const hrefs = EXPERIENCE_NAV.map((entry) => entry.href);
    expect(hrefs.some((href) => href.includes("/new"))).toBe(false);
    expect(hrefs.some((href) => href.includes(":"))).toBe(false);
    expect(hrefs.some((href) => href.includes("site-map"))).toBe(false);
  });

  it("highlights the longest matching list destination for a detail URL", () => {
    const empty = new URLSearchParams();
    const items = EXPERIENCE_NAV.find((entry) => entry.href === "/items");
    const dishes = EXPERIENCE_NAV.find((entry) => entry.href === "/dishes");
    const catalog = EXPERIENCE_NAV.find(
      (entry) => entry.href === "/catalog-search"
    );
    const dictionary = EXPERIENCE_NAV.find(
      (entry) => entry.href === DICTIONARY_HREF
    );
    expect(items).toBeDefined();
    expect(dishes).toBeDefined();
    expect(catalog).toBeDefined();
    expect(dictionary).toBeDefined();
    if (!items || !dishes || !catalog || !dictionary) return;

    expect(experienceNavIsActive(items, "/items/1", empty)).toBe(true);
    expect(experienceNavIsActive(dishes, "/items/1", empty)).toBe(false);
    expect(experienceNavIsActive(dictionary, DICTIONARY_HREF, empty)).toBe(
      true
    );
    expect(experienceNavIsActive(catalog, DICTIONARY_HREF, empty)).toBe(false);
  });

  it("only marks Overview home when the dashboard view is on", () => {
    const overview = EXPERIENCE_NAV.find(
      (entry) => entry.href === "/?view=dashboard"
    );
    expect(overview).toBeDefined();
    if (!overview) return;
    expect(
      experienceNavIsActive(
        overview,
        "/",
        new URLSearchParams("view=dashboard")
      )
    ).toBe(true);
    expect(experienceNavIsActive(overview, "/", new URLSearchParams())).toBe(
      false
    );
  });
});
