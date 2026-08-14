import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AiFallbackPanel } from "./AiFallbackPanel";

vi.mock("@remix-run/react", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (key === "chat.fallback.action.query" && params?.query) {
        return `Search catalog for “${params.query}”`;
      }
      if (key === "chat.fallback.metadata.query" && params?.query) {
        return `Search metadata for “${params.query}”`;
      }
      const labels = new Map<string, string>([
        ["chat.fallback.title", "AI is unavailable — continue manually"],
        ["chat.fallback.description", "Your input is preserved."],
        ["chat.fallback.action", "Open catalog search"],
        ["chat.fallback.metadata", "Browse metadata catalog"],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

describe("AiFallbackPanel (dual-path degradation)", () => {
  const TAKEOVER = "ai-fallback-takeover";
  const INTENT_Q = "intent=ai-fallback";

  it("prefills the user's query into the manual takeover link with intent", () => {
    render(<AiFallbackPanel query="weather data" />);
    const takeover = screen.getByTestId(TAKEOVER);
    expect(takeover.getAttribute("href")).toBe(
      `/catalog-search?q=weather+data&${INTENT_Q}`
    );
  });

  it("offers metadata catalog takeover with the same query and intent", () => {
    render(<AiFallbackPanel query="weather data" />);
    const metadata = screen.getByTestId("ai-fallback-metadata");
    expect(metadata.getAttribute("href")).toBe(
      `/metadata?q=weather+data&${INTENT_Q}`
    );
  });

  it("offers type-filter shortcuts carrying the same query and intent", () => {
    render(<AiFallbackPanel query="dict" />);
    expect(
      screen.getByTestId("ai-fallback-type-API").getAttribute("href")
    ).toBe(`/catalog-search?q=dict&type=API&${INTENT_Q}`);
    expect(
      screen.getByTestId("ai-fallback-type-Dataset").getAttribute("href")
    ).toBe(`/catalog-search?q=dict&type=Dataset&${INTENT_Q}`);
  });

  it("degrades gracefully with an empty query (bare catalog link)", () => {
    render(<AiFallbackPanel query="   " />);
    const takeover = screen.getByTestId(TAKEOVER);
    expect(takeover.getAttribute("href")).toBe(`/catalog-search?${INTENT_Q}`);
  });

  it("infers industry facets from hallmark queries into takeover URLs", () => {
    render(<AiFallbackPanel query="查一下 Au750" />);
    const takeover = screen.getByTestId(TAKEOVER);
    const href = takeover.getAttribute("href") ?? "";
    expect(href).toContain(INTENT_Q);
    expect(href).toContain("standard=18K");
    expect(href).toContain("material=gold");
  });

  it("infers commerce facets into takeover URLs", () => {
    render(<AiFallbackPanel query="想找鍛造入門體驗" />);
    const href = screen.getByTestId(TAKEOVER).getAttribute("href") ?? "";
    expect(href).toContain("productType=experience");
  });

  it("offers industry standard shortcut chips", () => {
    render(<AiFallbackPanel query="鍛造" />);
    expect(
      screen.getByTestId("ai-fallback-standard-925").getAttribute("href")
    ).toContain("standard=925");
    expect(
      screen.getByTestId("ai-fallback-standard-18K").getAttribute("href")
    ).toContain("standard=18K");
  });

  it("offers commerce shortcut chips", () => {
    render(<AiFallbackPanel query="銀" />);
    expect(
      screen.getByTestId("ai-fallback-commerce-experience").getAttribute("href")
    ).toContain("productType=experience");
    expect(
      screen.getByTestId("ai-fallback-commerce-auction").getAttribute("href")
    ).toContain("auctionEligible=true");
  });
});
