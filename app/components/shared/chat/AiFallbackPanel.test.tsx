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

describe("AiFallbackPanel (dual-path degradation)", () => {
  it("prefills the user's query into the manual takeover link", () => {
    render(<AiFallbackPanel query="weather data" />);
    const takeover = screen.getByTestId("ai-fallback-takeover");
    expect(takeover.getAttribute("href")).toBe(
      "/catalog-search?q=weather+data"
    );
  });

  it("offers type-filter shortcuts carrying the same query", () => {
    render(<AiFallbackPanel query="dict" />);
    expect(
      screen.getByTestId("ai-fallback-type-API").getAttribute("href")
    ).toBe("/catalog-search?q=dict&type=API");
    expect(
      screen.getByTestId("ai-fallback-type-Dataset").getAttribute("href")
    ).toBe("/catalog-search?q=dict&type=Dataset");
  });

  it("degrades gracefully with an empty query (bare catalog link)", () => {
    render(<AiFallbackPanel query="   " />);
    const takeover = screen.getByTestId("ai-fallback-takeover");
    expect(takeover.getAttribute("href")).toBe("/catalog-search");
  });
});
