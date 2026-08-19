import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { UX_SITEMAP } from "./ux-sitemap";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("ux sitemap inventory", () => {
  it("every routeFile exists", () => {
    for (const entry of UX_SITEMAP) {
      const routePath = join(repoRoot, entry.routeFile);
      // Inventory routeFile values are static strings from ux-sitemap.ts.
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- inventory SSOT
      expect(existsSync(routePath), entry.routeFile).toBe(true);
    }
  });

  it("includes nested human paths", () => {
    const paths = UX_SITEMAP.map((entry) => entry.path);
    expect(paths).toContain("/metadata/:id");
    expect(paths).toContain("/items/new");
    expect(paths).toContain("/items/:id");
    expect(paths).toContain("/dishes/:id");
    expect(paths).toContain("/recipes/:id");
    expect(paths).toContain("/release-notes/:version");
  });

  it("does not mix machine sitemap.xml", () => {
    expect(UX_SITEMAP.some((entry) => entry.path.includes("sitemap.xml"))).toBe(
      false
    );
  });
});
