import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatInterface } from "./ChatInterface";

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
    t: (key: string) => key,
  }),
}));

class FakeEventSource {
  static openCount = 0;
  static instances: FakeEventSource[] = [];
  url: string;
  onerror: ((ev: Event) => void) | null = null;
  closed = false;
  private listeners = new Map<string, Set<(ev: MessageEvent) => void>>();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.openCount += 1;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (ev: MessageEvent) => void) {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }

  close() {
    this.closed = true;
  }
}

describe("ChatInterface pendingQuery", () => {
  const OriginalEventSource = globalThis.EventSource;

  beforeEach(() => {
    FakeEventSource.openCount = 0;
    FakeEventSource.instances = [];
    Element.prototype.scrollIntoView = vi.fn();
    globalThis.EventSource = FakeEventSource as unknown as typeof EventSource;
  });

  afterEach(() => {
    globalThis.EventSource = OriginalEventSource;
  });

  it("submits the same pendingQuery only once under StrictMode", async () => {
    const onConsumed = vi.fn();
    render(
      <StrictMode>
        <ChatInterface
          pendingQuery="Which datasets contain PII?"
          onPendingQueryConsumed={onConsumed}
        />
      </StrictMode>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Which datasets contain PII?").length).toBe(1);
    });
    // Final mount may open one live stream; closed strict-remount streams do not count as duplicate UX
    const openStreams = FakeEventSource.instances.filter((s) => !s.closed);
    expect(openStreams.length).toBeLessThanOrEqual(1);
    expect(screen.getAllByText("Which datasets contain PII?").length).toBe(1);
  });
});
