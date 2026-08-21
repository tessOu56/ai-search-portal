import { describe, expect, it } from "vitest";

import { listPublicIndexPages } from "./public-index.server";

describe("listPublicIndexPages", () => {
  it("covers catalog, metadata, and public asset detail paths", () => {
    const pages = listPublicIndexPages();
    const paths = pages.map((page) => page.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/catalog-search");
    expect(paths).toContain("/metadata");
    expect(paths).toContain("/metadata/tbl-customers");
    expect(paths.some((path) => path.startsWith("/release-notes"))).toBe(true);
  });
});
