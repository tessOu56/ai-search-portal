import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatInterface } from "./ChatInterface";

vi.mock("react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    locale: "en",
    t: (key: string) => key,
  }),
}));

describe("ChatInterface a11y", () => {
  const OriginalEventSource = globalThis.EventSource;

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    globalThis.EventSource = class {
      url: string;
      onerror: ((ev: Event) => void) | null = null;
      constructor(url: string) {
        this.url = url;
      }
      addEventListener() {
        return undefined;
      }
      close() {
        return undefined;
      }
    } as unknown as typeof EventSource;
  });

  afterEach(() => {
    globalThis.EventSource = OriginalEventSource;
  });

  it("exposes an empty labelled transcript and a live region", () => {
    render(<ChatInterface />);

    expect(
      screen.getByRole("region", { name: "chat.history.title" })
    ).toBeInTheDocument();
    expect(screen.getByText("chat.history.empty")).toBeInTheDocument();
    expect(document.querySelector("[aria-live='polite']")).toBeTruthy();
    expect(screen.getByLabelText("home.composer.label")).toBeInTheDocument();
  });
});
