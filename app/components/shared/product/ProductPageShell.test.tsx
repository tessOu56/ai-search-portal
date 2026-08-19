import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OVERVIEW_HOME } from "~/lib/workspace-mode";

import { ProductPageShell } from "./ProductPageShell";

const APP_TITLE = "AI Search Portal";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("~/lib/workspace-mode", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, unknown>),
    canGoBackFromHistory: () => false,
  };
});

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
  useNavigate: () => navigate,
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const labels = new Map([
        ["app.title", APP_TITLE],
        ["nav.back", "Back"],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

describe("ProductPageShell", () => {
  it("rewrites the home crumb to Overview and never Back-falls back to Ask", async () => {
    navigate.mockReset();
    const user = userEvent.setup();
    render(
      <ProductPageShell
        crumbs={[{ to: "/", label: APP_TITLE }]}
        current="Catalog search"
      >
        <p>body</p>
      </ProductPageShell>
    );
    expect(screen.getByRole("link", { name: APP_TITLE })).toHaveAttribute(
      "href",
      OVERVIEW_HOME
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(navigate).toHaveBeenCalledWith(OVERVIEW_HOME);
  });
});
