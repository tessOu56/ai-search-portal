import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AssistantTurn } from "./AssistantTurn";

vi.mock("react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("~/shared/i18n/context", () => {
  const labels = new Map<string, string>([
    ["chat.confidence", "Confidence"],
    ["chat.confidence.demo", "(demo)"],
    ["chat.next.title", "Next steps"],
    ["chat.sources.title", "References"],
    ["chat.continue.catalog", "Continue in catalog"],
    ["chat.continue.metadata", "Browse metadata"],
    ["chat.continue.request", "Request this asset"],
    ["chat.error.title", "Error"],
    ["chat.summary.waiting", "Waiting for reply..."],
    ["chat.fallback.title", "AI is unavailable — continue manually"],
    ["chat.fallback.description", "Your input is preserved."],
    ["chat.fallback.action", "Open catalog search"],
    ["chat.fallback.metadata", "Browse metadata catalog"],
  ]);
  return {
    useI18n: () => ({
      t: (key: string, params?: Record<string, string>) => {
        if (key === "chat.fallback.action.query" && params?.query) {
          return `Search catalog for “${params.query}”`;
        }
        if (key === "chat.fallback.metadata.query" && params?.query) {
          return `Search metadata for “${params.query}”`;
        }
        return labels.get(key) ?? key;
      },
    }),
  };
});

describe("AssistantTurn (LUI conversation)", () => {
  const CONTINUE = "chat-continue-facets";
  const WAITING = "Waiting for reply...";
  const NEXT_ACTION = "chat-next-action";
  const REQUEST_HREF = "/metadata/tbl-customers?purpose=marketing&role=analyst";
  it("empty: omits waiting copy, sources, next steps, and continue chips", () => {
    render(<AssistantTurn content="" />);
    expect(screen.queryByText(WAITING)).not.toBeInTheDocument();
    expect(screen.queryByText("References")).not.toBeInTheDocument();
    expect(screen.queryByText("Next steps")).not.toBeInTheDocument();
    expect(screen.queryByTestId(CONTINUE)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("assistant-stream-cursor")
    ).not.toBeInTheDocument();
  });

  it("streaming: shows body and cursor, hides sources even if passed", () => {
    render(
      <AssistantTurn
        content="Partial answer"
        isStreaming
        sources={[{ title: "Hidden", url: "/metadata" }]}
        nextSteps={["Should not show"]}
      />
    );
    expect(screen.getByText("Partial answer")).toBeInTheDocument();
    expect(screen.getByTestId("assistant-stream-cursor")).toBeInTheDocument();
    expect(screen.queryByText("References")).not.toBeInTheDocument();
    expect(screen.queryByText("Should not show")).not.toBeInTheDocument();
  });

  it("complete: inlines summary, confidence, sources, next steps, and continue", () => {
    render(
      <AssistantTurn
        content="Full answer about PII datasets."
        summary="Three datasets include PII."
        confidence={0.87}
        sources={[
          {
            title: "customer_profile",
            url: "/metadata/customer_profile",
            source: "glossary#pii",
          },
        ]}
        nextSteps={["Request access with masking"]}
        nextActions={[
          {
            label: "Open tbl-customers and request",
            href: REQUEST_HREF,
          },
        ]}
        query="Which datasets contain PII?"
        showContinue
      />
    );
    expect(screen.getByText("Three datasets include PII.")).toBeInTheDocument();
    expect(screen.getByText("Confidence 87% (demo)")).toBeInTheDocument();
    expect(
      screen.getByText("Full answer about PII datasets.")
    ).toBeInTheDocument();
    expect(screen.getByText("customer_profile")).toBeInTheDocument();
    expect(screen.getByText("glossary#pii")).toBeInTheDocument();
    expect(
      screen.getByText("Open tbl-customers and request")
    ).toBeInTheDocument();
    expect(screen.getByTestId(NEXT_ACTION)).toHaveAttribute(
      "href",
      REQUEST_HREF
    );
    expect(
      screen.queryByText("Request access with masking")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(CONTINUE)).toBeInTheDocument();
    const catalogHref =
      screen.getByTestId("chat-continue-catalog").getAttribute("href") ?? "";
    expect(catalogHref.startsWith("/catalog-search?")).toBe(true);
    expect(catalogHref).not.toMatch(/material=|auctionEligible=/);
    expect(screen.getByTestId("chat-continue-request")).toHaveAttribute(
      "href",
      REQUEST_HREF
    );
  });

  it("drops javascript and protocol-relative nextActions as non-links", () => {
    render(
      <AssistantTurn
        content="Unsafe action must not be clickable."
        summary="Guard href schemes from LUI payloads."
        nextActions={[
          {
            label: "Do not execute",
            href: "javascript:alert(1)",
          },
          {
            label: "Do not leave origin",
            href: "//evil.com/phish",
          },
        ]}
        query="unsafe href"
      />
    );
    const actions = screen.getAllByTestId(NEXT_ACTION);
    expect(actions).toHaveLength(2);
    for (const action of actions) {
      expect(action.tagName).toBe("SPAN");
      expect(action).not.toHaveAttribute("href");
    }
  });

  it("external LIVE nextActions open in a new tab", () => {
    render(
      <AssistantTurn
        content="Auction journey is on Plinth."
        summary="生態轉址 · 拍賣 kind 到 Plinth LIVE。"
        nextActions={[
          {
            label: "開啟 Plinth 示範拍品（LIVE）",
            href: "https://metalcraft-storefront-eta.vercel.app/en/lots/lot-1",
          },
        ]}
        query="拍賣拍品在哪裡出價？"
      />
    );
    const action = screen.getByTestId(NEXT_ACTION);
    expect(action).toHaveAttribute(
      "href",
      "https://metalcraft-storefront-eta.vercel.app/en/lots/lot-1"
    );
    expect(action).toHaveAttribute("target", "_blank");
    expect(action).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("complete with empty sources: hides References, keeps continue buttons", () => {
    render(
      <AssistantTurn
        content="No direct hit."
        summary="示範 · 尚無直接命中。"
        sources={[]}
        nextSteps={["Clarify scope"]}
        query="obscure topic"
        showContinue
      />
    );
    expect(screen.queryByText("References")).not.toBeInTheDocument();
    expect(screen.getByTestId(CONTINUE)).toBeInTheDocument();
    expect(screen.getByText("Clarify scope")).toBeInTheDocument();
  });

  it("error: shows alert and dual-path fallback, not continue chips", async () => {
    render(
      <AssistantTurn
        content=""
        query="weather data"
        error="Connection lost. Please try again."
        showContinue
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Connection lost. Please try again."
    );
    expect(await screen.findByTestId("ai-fallback-panel")).toBeInTheDocument();
    expect(screen.getByTestId("ai-fallback-takeover")).toBeInTheDocument();
    expect(screen.queryByTestId(CONTINUE)).not.toBeInTheDocument();
  });
});
