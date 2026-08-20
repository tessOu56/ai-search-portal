import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AssistantTurn } from "./AssistantTurn";

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

vi.mock("~/shared/i18n/context", () => {
  const labels = new Map<string, string>([
    ["chat.confidence", "Confidence"],
    ["chat.next.title", "Next steps"],
    ["chat.sources.title", "References"],
    ["chat.continue.catalog", "Continue in catalog"],
    ["chat.continue.metadata", "Browse metadata"],
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
        query="Which datasets contain PII?"
        showContinue
      />
    );
    expect(screen.getByText("Three datasets include PII.")).toBeInTheDocument();
    expect(screen.getByText("Confidence 87%")).toBeInTheDocument();
    expect(
      screen.getByText("Full answer about PII datasets.")
    ).toBeInTheDocument();
    expect(screen.getByText("customer_profile")).toBeInTheDocument();
    expect(screen.getByText("glossary#pii")).toBeInTheDocument();
    expect(screen.getByText("Request access with masking")).toBeInTheDocument();
    expect(screen.getByTestId(CONTINUE)).toBeInTheDocument();
    expect(screen.getByTestId("chat-continue-catalog")).toBeInTheDocument();
    expect(screen.getByTestId("chat-continue-metadata")).toBeInTheDocument();
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

  it("error: shows alert and dual-path fallback, not continue chips", () => {
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
    expect(screen.getByTestId("ai-fallback-panel")).toBeInTheDocument();
    expect(screen.getByTestId("ai-fallback-takeover")).toBeInTheDocument();
    expect(screen.queryByTestId(CONTINUE)).not.toBeInTheDocument();
  });
});
