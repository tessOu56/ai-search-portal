import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getCatalogSearchPlaceholder } from "./catalog-search.server";
import { CatalogSearchPanel } from "./CatalogSearchPanel";

describe("catalog-search shell", () => {
  it("getCatalogSearchPlaceholder returns filters and mock rows", () => {
    const model = getCatalogSearchPlaceholder("");
    expect(model.phase).toBe("placeholder");
    expect(model.filters.length).toBeGreaterThan(0);
    expect(model.results.length).toBeGreaterThan(0);
  });

  it("CatalogSearchPanel renders search and results", () => {
    const model = getCatalogSearchPlaceholder("dictionary");
    render(<CatalogSearchPanel model={model} />);
    expect(
      screen.getByRole("heading", { name: /catalog search/i })
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: /catalog search query/i })
    ).toBeTruthy();
    expect(screen.getByText(/dictionary\/search/i)).toBeTruthy();
  });
});
