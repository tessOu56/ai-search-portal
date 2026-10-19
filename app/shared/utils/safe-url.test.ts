import { describe, expect, it } from "vitest";

import { classifySafeHref, safeInternalRedirectPath } from "./safe-url";

describe("safeInternalRedirectPath", () => {
  it("keeps in-app paths and query strings", () => {
    expect(safeInternalRedirectPath("/catalog-search?q=pii")).toBe(
      "/catalog-search?q=pii"
    );
    expect(safeInternalRedirectPath("/metadata/tbl-customers#faq")).toBe(
      "/metadata/tbl-customers#faq"
    );
  });

  it("rejects protocol-relative and backslash open redirects", () => {
    expect(safeInternalRedirectPath("//evil.com")).toBe("/");
    expect(safeInternalRedirectPath("//evil.com/phish")).toBe("/");
    expect(safeInternalRedirectPath("/\\evil.com")).toBe("/");
    expect(safeInternalRedirectPath("\\\\evil.com")).toBe("/");
  });

  it("rejects javascript and foreign absolute URLs", () => {
    expect(safeInternalRedirectPath("javascript:alert(1)")).toBe("/");
    expect(safeInternalRedirectPath("https://evil.com/phish")).toBe("/");
    expect(
      safeInternalRedirectPath("https://evil.com/phish", "https://app.local")
    ).toBe("/");
  });

  it("allows same-origin absolute URLs when origin is provided", () => {
    expect(
      safeInternalRedirectPath(
        "https://app.local/metadata?pack=agri-supply",
        "https://app.local"
      )
    ).toBe("/metadata?pack=agri-supply");
  });

  it("falls back for empty or non-string input", () => {
    expect(safeInternalRedirectPath(null)).toBe("/");
    expect(safeInternalRedirectPath("   ")).toBe("/");
  });
});

describe("classifySafeHref", () => {
  it("treats in-app paths as internal", () => {
    expect(classifySafeHref("/metadata/tbl-customers")).toBe("internal");
    expect(
      classifySafeHref("/metadata/tbl-customers?purpose=marketing&role=analyst")
    ).toBe("internal");
  });

  it("treats http(s) URLs as external", () => {
    expect(
      classifySafeHref(
        "https://metalcraft-storefront-eta.vercel.app/en/lots/lot-1"
      )
    ).toBe("external");
    expect(classifySafeHref("http://localhost:3000/docs")).toBe("external");
  });

  it("rejects javascript, data, and protocol-relative hrefs", () => {
    expect(classifySafeHref("javascript:alert(1)")).toBe("unsafe");
    expect(classifySafeHref("data:text/html,hi")).toBe("unsafe");
    expect(classifySafeHref("//evil.com")).toBe("unsafe");
    expect(classifySafeHref("/\\evil.com")).toBe("unsafe");
  });
});
