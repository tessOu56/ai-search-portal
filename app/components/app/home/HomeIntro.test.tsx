import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeIntro } from "./HomeIntro";

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
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const labels = new Map<string, string>([
        ["home.section.what.title", "What this is"],
        ["home.section.what.desc", "Ask in plain language."],
        ["home.section.how.title", "What you get when you ask"],
        ["home.section.how.desc", "Answer, sources, next step."],
        ["home.step.conclusion", "A clear answer"],
        ["home.step.conclusion.desc", "Understand first."],
        ["home.step.sources", "Sources you can check"],
        ["home.step.sources.desc", "See where it came from."],
        ["home.step.next", "A next step"],
        ["home.step.next.desc", "Know what to do."],
        ["home.section.browse.title", "Browse without asking"],
        ["home.section.browse.desc", "Open the catalog."],
        ["home.section.browse.catalog", "Catalog search"],
        ["home.section.browse.dishes", "Sample dishes"],
        ["home.cta.dashboard", "Open overview"],
        ["footer.synthetic.hint", "Synthetic catalog."],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

describe("HomeIntro", () => {
  it("renders three visitor sections with browse paths", () => {
    render(<HomeIntro />);
    expect(
      screen.getByRole("heading", { name: "What this is" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What you get when you ask" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Browse without asking" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Catalog search" })
    ).toHaveAttribute("href", "/catalog-search");
    expect(screen.getByRole("link", { name: "Sample dishes" })).toHaveAttribute(
      "href",
      "/dishes"
    );
    expect(screen.getByRole("link", { name: "Open overview" })).toHaveAttribute(
      "href",
      "/?view=dashboard"
    );
  });
});
