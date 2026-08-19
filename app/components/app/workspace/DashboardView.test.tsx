import { render, screen } from "@testing-library/react";
import { forwardRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { DashboardView } from "./DashboardView";
import { WorkspaceSessionProvider } from "./WorkspaceSession";

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
  Form: forwardRef<HTMLFormElement, { children: React.ReactNode }>(
    ({ children }, ref) => <form ref={ref}>{children}</form>
  ),
  useRouteLoaderData: () => ({ locale: "en", version: "0.0.0" }),
  useLocation: () => ({ pathname: "/", search: "?view=dashboard" }),
  useSearchParams: () => [new URLSearchParams("view=dashboard"), vi.fn()],
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, string>) => {
      const labels = new Map<string, string>([
        ["overview.title", "What you can look up"],
        ["overview.desc", "Ask one of these questions."],
        ["overview.ask", "Ask this"],
        ["overview.browse", "Look it up yourself"],
        ["overview.pii.title", "Personal data and access"],
        ["overview.pii.desc", "See which records include personal data."],
        ["overview.lineage.title", "Where a record comes from"],
        ["overview.lineage.desc", "Trace a customer record."],
        ["overview.orders.title", "Order data and interfaces"],
        ["overview.orders.desc", "Find order datasets and APIs."],
        ["overview.browse.title", "Browse without asking"],
        ["overview.browse.desc", "Open the catalog or sample dishes."],
        [
          "home.composer.suggest.1",
          "Which datasets contain PII and what access do I need?",
        ],
        [
          "home.composer.suggest.2",
          "What is the upstream lineage of customer_profile?",
        ],
        ["home.composer.suggest.3", "Find APIs and datasets related to orders"],
        ["home.section.browse.catalog", "Catalog search"],
        ["home.section.browse.dishes", "Sample dishes"],
        ["app.title", "AI Search Portal"],
        ["footer.copyright", `© ${vars?.year ?? "2026"} AI Search Portal`],
        ["footer.version", "v0.0.0"],
        ["footer.sitemap", "Site map"],
        ["footer.vitals", "Web Vitals"],
        ["footer.synthetic", "Demo data"],
        ["footer.synthetic.hint", "Synthetic catalog."],
        ["footer.demo_roles", "Demo roles"],
        ["footer.demo_roles.hint", "Not auth."],
        ["release-notes.footer.link", "Release notes"],
        ["locale.switch", "Language"],
        ["locale.zh-TW", "繁體中文"],
        ["locale.en", "English"],
        ["theme.switch", "Theme"],
        ["theme.toLight", "Switch to light"],
        ["theme.toDark", "Switch to dark"],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

describe("DashboardView", () => {
  it("presents business queries instead of empty metrics", () => {
    render(
      <WorkspaceSessionProvider>
        <DashboardView />
      </WorkspaceSessionProvider>
    );
    expect(
      screen.getByRole("heading", { name: "What you can look up" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Personal data and access" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Where a record comes from" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Order data and interfaces" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No data source connected")
    ).not.toBeInTheDocument();
    const askLinks = screen.getAllByRole("link", { name: "Ask this" });
    expect(askLinks[0]).toHaveAttribute(
      "href",
      `/?q=${encodeURIComponent("Which datasets contain PII and what access do I need?")}`
    );
    expect(
      screen.getByRole("link", { name: "Catalog search" })
    ).toHaveAttribute("href", "/catalog-search");
  });
});
