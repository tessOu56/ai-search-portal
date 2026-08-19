import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkspaceSessionProvider } from "./WorkspaceSession";
import { WorkspaceTopbar } from "./WorkspaceTopbar";

const APP_TITLE = "AI Search Portal";
const nav = vi.hoisted(() => ({ pathname: "/", search: "" }));

vi.mock("@remix-run/react", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <a href={to} {...props}>
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

vi.mock("~/components/ui/BrandMark", () => ({
  BrandMark: ({ wordmark }: { wordmark: string }) => <span>{wordmark}</span>,
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const labels = new Map([
        ["app.title", APP_TITLE],
        ["home.nav.ask", "Ask"],
        ["home.nav.overview", "Overview"],
        ["home.nav.switcher", "Workspace view"],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

afterEach(() => {
  nav.pathname = "/";
  nav.search = "";
});

describe("WorkspaceTopbar", () => {
  it("keeps brand on Overview home from a deep page", () => {
    nav.pathname = "/catalog-search";
    render(
      <WorkspaceSessionProvider>
        <WorkspaceTopbar />
      </WorkspaceSessionProvider>
    );
    expect(screen.getByRole("link", { name: APP_TITLE })).toHaveAttribute(
      "href",
      "/?view=dashboard"
    );
  });

  it("keeps brand on Ask home while asking", () => {
    nav.pathname = "/";
    nav.search = "";
    render(
      <WorkspaceSessionProvider>
        <WorkspaceTopbar />
      </WorkspaceSessionProvider>
    );
    expect(screen.getByRole("link", { name: APP_TITLE })).toHaveAttribute(
      "href",
      "/"
    );
  });
});
