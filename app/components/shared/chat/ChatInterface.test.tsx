import { act, render, screen, waitFor } from "@testing-library/react";
import { type ReactNode, StrictMode } from "react";
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

  emit(type: string, data: string) {
    const event = { data } as MessageEvent<string>;
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

const PII_QUERY = "Which datasets contain PII?";

function openStream() {
  const stream = FakeEventSource.instances.find((instance) => !instance.closed);
  expect(stream).toBeDefined();
  return stream as FakeEventSource;
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
          pendingQuery={PII_QUERY}
          onPendingQueryConsumed={onConsumed}
        />
      </StrictMode>
    );

    await waitFor(() => {
      expect(screen.getAllByText(PII_QUERY).length).toBe(1);
    });
    // Final mount may open one live stream; closed strict-remount streams do not count as duplicate UX
    const openStreams = FakeEventSource.instances.filter((s) => !s.closed);
    expect(openStreams.length).toBeLessThanOrEqual(1);
    expect(screen.getAllByText(PII_QUERY).length).toBe(1);
  });

  it("does not open a stream for a blank pendingQuery", () => {
    render(<ChatInterface pendingQuery="   " />);
    expect(FakeEventSource.instances).toHaveLength(0);
  });
});

describe("ChatInterface SSE lifecycle", () => {
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

  it("renders streamed summary, tokens, and next actions", async () => {
    const onAgentModeChange = vi.fn();
    render(
      <ChatInterface
        pendingQuery={PII_QUERY}
        onAgentModeChange={onAgentModeChange}
      />
    );

    await waitFor(() => {
      expect(
        FakeEventSource.instances.some((instance) => !instance.closed)
      ).toBe(true);
    });
    const stream = openStream();
    expect(stream.url).toContain("/api/chat?q=");

    act(() => {
      stream.emit(
        "meta",
        JSON.stringify({
          query: PII_QUERY,
          summary: "PII datasets need HITL approval",
          confidence: 0.91,
          agentMode: "offline_fixture",
        })
      );
      stream.emit("token", "customer_profile is classified PII.");
      stream.emit(
        "final",
        JSON.stringify({
          sources: [
            {
              title: "customer_profile",
              url: "/metadata/tbl-customers",
            },
          ],
          nextSteps: ["Request access"],
          nextActions: [
            {
              label: "Open the asset",
              href: "/metadata/tbl-customers?purpose=marketing&role=analyst",
            },
          ],
        })
      );
      stream.emit("done", "done");
    });

    await waitFor(() => {
      expect(
        screen.getByText("customer_profile is classified PII.")
      ).toBeInTheDocument();
    });
    expect(
      screen.getAllByText("PII datasets need HITL approval").length
    ).toBeGreaterThan(0);
    expect(onAgentModeChange).toHaveBeenCalledWith("offline_fixture");
    expect(screen.getByTestId("chat-next-action")).toHaveAttribute(
      "href",
      "/metadata/tbl-customers?purpose=marketing&role=analyst"
    );
  });

  it("surfaces a connection error without leaving the stream open", async () => {
    render(<ChatInterface pendingQuery="orders lineage" />);
    await waitFor(() => {
      expect(
        FakeEventSource.instances.some((instance) => !instance.closed)
      ).toBe(true);
    });
    const stream = openStream();
    act(() => {
      stream.onerror?.(new Event("error"));
    });
    await waitFor(() => {
      expect(screen.getByText("chat.error.connection")).toBeInTheDocument();
    });
    expect(stream.closed).toBe(true);
  });

  it("surfaces a parse error when meta payload is invalid JSON", async () => {
    render(<ChatInterface pendingQuery="broken stream" />);
    await waitFor(() => {
      expect(
        FakeEventSource.instances.some((instance) => !instance.closed)
      ).toBe(true);
    });
    act(() => {
      openStream().emit("meta", "{not-json");
    });
    await waitFor(() => {
      expect(screen.getByText("chat.error.parse")).toBeInTheDocument();
    });
  });
});
