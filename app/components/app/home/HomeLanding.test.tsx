import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { HomeLanding } from "./HomeLanding";

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
    t: (key: string, vars?: Record<string, string>) => {
      const labels = new Map<string, string>([
        ["app.title", "Portal"],
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
        ["home.workbench.title", "Workbench"],
        ["home.workbench.pending", "Pending requests: {count}"],
        ["home.workbench.suggested", "Suggested assets"],
        ["nav.my-requests", "My requests"],
        ["composer.voice.start", "Voice input"],
        ["composer.voice.stop", "Stop voice input"],
        ["composer.voice.listening", "Listening"],
        ["composer.voice.denied", "Microphone permission denied"],
        ["composer.voice.error", "Voice recognition failed"],
        ["composer.voice.privacy", "Speech may be sent to the browser vendor"],
      ]);
      let value = labels.get(key) ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replaceAll(`{${k}}`, v);
        }
      }
      return value;
    },
  }),
}));

describe("HomeLanding", () => {
  it("shows one composer and golden questions without empty evidence cards", () => {
    render(<HomeLanding onAsk={vi.fn()} />);
    expect(screen.getByLabelText("Ask a question")).toBeInTheDocument();
    expect(screen.getAllByTestId("golden-question")).toHaveLength(3);
    expect(screen.getByTestId("home-workbench")).toBeInTheDocument();
    expect(screen.getByText("Pending requests: 0")).toBeInTheDocument();
    expect(screen.queryByTestId("assistant-turn")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("chat-continue-catalog")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("chat.summary.title")).not.toBeInTheDocument();
    expect(screen.queryByText("chat.sources.title")).not.toBeInTheDocument();
    expect(screen.queryByText("chat.next.title")).not.toBeInTheDocument();
  });
});
