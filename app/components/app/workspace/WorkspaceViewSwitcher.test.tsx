import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LAST_OVERVIEW_STORAGE_KEY } from "~/lib/workspace-mode";

import { WorkspaceSessionProvider } from "./WorkspaceSession";
import { WorkspaceViewSwitcher } from "./WorkspaceViewSwitcher";

const ASK_LABEL = "Ask";
const OVERVIEW_LABEL = "Overview";
const CATALOG_PATH = "/catalog-search";
const ARIA_CURRENT = "aria-current";
const nav = vi.hoisted(() => ({ pathname: "/", search: "" }));

vi.mock("@remix-run/react", () => ({
  Link: ({
    to,
    children,
    onClick,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={to} onClick={onClick} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: nav.pathname, search: nav.search }),
  useSearchParams: () => [
    new URLSearchParams(
      nav.search.startsWith("?") ? nav.search.slice(1) : nav.search
    ),
    vi.fn(),
  ],
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const labels = new Map([
        ["home.nav.ask", ASK_LABEL],
        ["home.nav.overview", OVERVIEW_LABEL],
        ["home.nav.switcher", "Workspace view"],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

afterEach(() => {
  nav.pathname = "/";
  nav.search = "";
  sessionStorage.removeItem(LAST_OVERVIEW_STORAGE_KEY);
});

describe("WorkspaceViewSwitcher", () => {
  it("selects Overview on a deep route and sends Ask home to /", async () => {
    nav.pathname = CATALOG_PATH;
    nav.search = "";
    render(
      <WorkspaceSessionProvider>
        <WorkspaceViewSwitcher />
      </WorkspaceSessionProvider>
    );
    const ask = screen.getByRole("link", { name: ASK_LABEL });
    const overview = screen.getByRole("link", { name: OVERVIEW_LABEL });
    expect(ask).toHaveAttribute("href", "/");
    expect(ask).not.toHaveAttribute(ARIA_CURRENT, "page");
    expect(overview).toHaveAttribute(ARIA_CURRENT, "page");
    await waitFor(() => {
      expect(overview).toHaveAttribute("href", CATALOG_PATH);
    });
  });

  it("restores the last overview path from Ask", async () => {
    sessionStorage.setItem(LAST_OVERVIEW_STORAGE_KEY, "/metadata");
    nav.pathname = "/";
    nav.search = "";
    render(
      <WorkspaceSessionProvider>
        <WorkspaceViewSwitcher />
      </WorkspaceSessionProvider>
    );
    expect(screen.getByRole("link", { name: ASK_LABEL })).toHaveAttribute(
      ARIA_CURRENT,
      "page"
    );
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: OVERVIEW_LABEL })
      ).toHaveAttribute("href", "/metadata");
    });
  });
});
