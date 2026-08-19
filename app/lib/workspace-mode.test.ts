import { afterEach, describe, expect, it } from "vitest";

import {
  ASK_HOME,
  backFallbackHref,
  brandHref,
  LAST_OVERVIEW_STORAGE_KEY,
  nextLastOverviewHref,
  OVERVIEW_HOME,
  overviewSwitchHref,
  parseStoredOverviewPath,
  rememberOverviewLocation,
  serializeOverviewHref,
  workspaceModeFromLocation,
  writeLastOverviewPath,
} from "./workspace-mode";

const CATALOG_PATH = "/catalog-search";

afterEach(() => {
  sessionStorage.removeItem(LAST_OVERVIEW_STORAGE_KEY);
});

describe("workspaceModeFromLocation", () => {
  it("treats bare home as Ask", () => {
    expect(workspaceModeFromLocation("/", new URLSearchParams())).toBe("ask");
    expect(workspaceModeFromLocation("/", new URLSearchParams("q=pii"))).toBe(
      "ask"
    );
  });

  it("treats dashboard view and every other path as Overview", () => {
    expect(
      workspaceModeFromLocation("/", new URLSearchParams("view=dashboard"))
    ).toBe("overview");
    expect(
      workspaceModeFromLocation("/", new URLSearchParams("view=saas"))
    ).toBe("overview");
    expect(workspaceModeFromLocation(CATALOG_PATH, new URLSearchParams())).toBe(
      "overview"
    );
    expect(workspaceModeFromLocation("/metadata", new URLSearchParams())).toBe(
      "overview"
    );
    expect(workspaceModeFromLocation("/dishes", new URLSearchParams())).toBe(
      "overview"
    );
  });
});

describe("brand and switch hrefs", () => {
  it("sends brand to overview home while browsing", () => {
    expect(brandHref("overview")).toBe(OVERVIEW_HOME);
    expect(brandHref("ask")).toBe(ASK_HOME);
  });

  it("keeps Overview switch on the current deep path", () => {
    expect(overviewSwitchHref("overview", CATALOG_PATH, "?q=925")).toBe(
      `${CATALOG_PATH}?q=925`
    );
    expect(overviewSwitchHref("overview", "/", "?view=dashboard")).toBe(
      OVERVIEW_HOME
    );
  });

  it("restores last overview when switching back from Ask", () => {
    writeLastOverviewPath("/metadata", "?q=customer");
    expect(overviewSwitchHref("ask", "/", "")).toBe("/metadata?q=customer");
  });

  it("keeps the previous Overview path after an Ask query", () => {
    expect(nextLastOverviewHref("ask", "/", "?q=pii", CATALOG_PATH)).toBe(
      CATALOG_PATH
    );
    writeLastOverviewPath(CATALOG_PATH, "");
    rememberOverviewLocation("/", "?q=pii", new URLSearchParams("q=pii"));
    expect(overviewSwitchHref("ask", "/", "?q=pii")).toBe(CATALOG_PATH);
  });
});

describe("parseStoredOverviewPath", () => {
  it("rejects protocol-relative and absolute URLs", () => {
    expect(parseStoredOverviewPath("//evil.example")).toBe(OVERVIEW_HOME);
    expect(parseStoredOverviewPath("https://evil.example/x")).toBe(
      OVERVIEW_HOME
    );
    expect(parseStoredOverviewPath("/ok")).toBe("/ok");
  });

  it("never stores Ask home as an overview path", () => {
    expect(parseStoredOverviewPath("/")).toBe(OVERVIEW_HOME);
    expect(parseStoredOverviewPath("/?q=hi")).toBe(OVERVIEW_HOME);
    expect(serializeOverviewHref("/", "?view=dashboard")).toBe(OVERVIEW_HOME);
  });
});

describe("rememberOverviewLocation", () => {
  it("writes only when the location is Overview", () => {
    rememberOverviewLocation("/dishes", "", new URLSearchParams());
    expect(sessionStorage.getItem(LAST_OVERVIEW_STORAGE_KEY)).toBe("/dishes");
    rememberOverviewLocation("/", "?q=pii", new URLSearchParams("q=pii"));
    expect(sessionStorage.getItem(LAST_OVERVIEW_STORAGE_KEY)).toBe("/dishes");
  });
});

describe("backFallbackHref", () => {
  it("never falls back to Ask home", () => {
    expect(backFallbackHref(undefined)).toBe(OVERVIEW_HOME);
    expect(backFallbackHref([{ to: "/" }])).toBe(OVERVIEW_HOME);
    expect(
      backFallbackHref([{ to: OVERVIEW_HOME }, { to: CATALOG_PATH }])
    ).toBe(CATALOG_PATH);
  });
});
