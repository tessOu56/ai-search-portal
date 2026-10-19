import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundaryFallback } from "./ErrorBoundaryFallback";

const rootData = vi.hoisted(() => ({
  current: undefined as
    { locale?: string; translations?: Record<string, string> } | undefined,
}));

vi.mock("react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouteLoaderData: () => rootData.current,
}));

describe("ErrorBoundaryFallback", () => {
  it("uses Traditional Chinese CTAs when root translations are missing", () => {
    rootData.current = { locale: "zh-TW" };
    render(
      <ErrorBoundaryFallback
        title="找不到頁面"
        message="不存在"
        statusCode={404}
      />
    );
    expect(screen.getByRole("button", { name: "重新整理" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "返回首頁" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("uses English CTAs for the English locale without translations", () => {
    rootData.current = { locale: "en" };
    render(<ErrorBoundaryFallback title="Page not found" message="Missing" />);
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to home" })).toBeTruthy();
  });
});
