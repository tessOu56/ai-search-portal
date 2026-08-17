import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { HomeLanding } from "./HomeLanding";

vi.mock("~/components/ui/BrandMark", () => ({
  BrandMark: () => <div>Brand</div>,
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      className,
    }: {
      children?: ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
    h1: ({
      children,
      className,
    }: {
      children?: ReactNode;
      className?: string;
    }) => <h1 className={className}>{children}</h1>,
    p: ({
      children,
      className,
    }: {
      children?: ReactNode;
      className?: string;
    }) => <p className={className}>{children}</p>,
  },
  useReducedMotion: () => true,
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    locale: "en",
    t: (key: string) => {
      const labels = new Map<string, string>([
        ["app.title", "AI Search Portal"],
        ["home.title", "Find data you can trust"],
        ["home.tagline", "Ask, then act with sources."],
        ["home.composer.label", "Ask a question"],
        ["chat.submit", "Send"],
        ["chat.placeholder", "Type a question"],
        ["home.composer.hint.1", "Ask about PII access"],
        ["home.composer.hint.2", "Trace a dataset"],
        ["home.composer.hint.3", "Find related APIs"],
        ["home.composer.suggest.1", "Which datasets contain PII?"],
        ["home.composer.suggest.2", "What is the upstream lineage?"],
        ["home.composer.suggest.3", "Find APIs related to orders"],
        ["composer.voice.start", "Voice input"],
        ["composer.voice.stop", "Stop voice input"],
        ["composer.voice.listening", "Listening"],
        ["composer.voice.denied", "Microphone permission denied"],
        ["composer.voice.error", "Voice recognition failed"],
        ["composer.voice.privacy", "Speech may be sent to the browser vendor"],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

describe("HomeLanding", () => {
  it("shows one composer and golden questions without empty evidence cards", () => {
    render(<HomeLanding onAsk={vi.fn()} />);
    expect(screen.getByLabelText("Ask a question")).toBeInTheDocument();
    expect(screen.getAllByTestId("golden-question")).toHaveLength(3);
    expect(screen.queryByTestId("assistant-turn")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("chat-continue-catalog")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("chat.summary.title")).not.toBeInTheDocument();
    expect(screen.queryByText("chat.sources.title")).not.toBeInTheDocument();
    expect(screen.queryByText("chat.next.title")).not.toBeInTheDocument();
  });
});
