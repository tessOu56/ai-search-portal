import { describe, expect, it, vi } from "vitest";

import {
  createStableSseClient,
  orderStableSseEvents,
  type StableSseMessage,
} from "./stable-sse-client";

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  listeners = new Map<string, Array<(ev: MessageEvent) => void>>();
  closed = false;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener) {
    const list = this.listeners.get(type) ?? [];
    list.push(listener as (ev: MessageEvent) => void);
    this.listeners.set(type, list);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: string, lastEventId = "") {
    const ev = { data, lastEventId } as MessageEvent;
    if (type === "message") {
      this.onmessage?.(ev);
      return;
    }
    for (const listener of this.listeners.get(type) ?? []) {
      listener(ev);
    }
  }
}

describe("orderStableSseEvents", () => {
  it("drops duplicate ids and sorts by seq (disorder)", () => {
    const events: StableSseMessage[] = [
      { id: "b", event: "token", data: "2", seq: 2 },
      { id: "a", event: "token", data: "1", seq: 1 },
      { id: "a", event: "token", data: "dup", seq: 3 },
    ];
    const ordered = orderStableSseEvents(events);
    expect(ordered.map((e) => e.id)).toEqual(["a", "b"]);
    expect(ordered.map((e) => e.data)).toEqual(["1", "2"]);
  });
});

describe("createStableSseClient", () => {
  it("assigns seq, tracks Last-Event-ID, ignores duplicate ids", () => {
    FakeEventSource.instances = [];
    const received: StableSseMessage[] = [];
    const client = createStableSseClient({
      url: "/api/chat?q=hi",
      eventTypes: ["token"],
      createEventSource: (url) =>
        new FakeEventSource(url) as unknown as EventSource,
      onEvent: (m) => received.push(m),
    });

    const es = FakeEventSource.instances[0];
    es.emit("token", "hello", "1");
    es.emit("token", "dup", "1");
    es.emit("token", "world", "2");

    expect(received.map((m) => m.data)).toEqual(["hello", "world"]);
    expect(received.map((m) => m.seq)).toEqual([1, 2]);
    expect(client.lastEventId()).toBe("2");
    client.abort();
  });

  it("reconnects with lastEventId then stops after interrupt/exhaust", () => {
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    const errors: string[] = [];
    const client = createStableSseClient({
      url: "/api/chat?q=hi",
      maxRetries: 1,
      retryBaseMs: 10,
      createEventSource: (url) =>
        new FakeEventSource(url) as unknown as EventSource,
      onError: (e) => errors.push(e.message),
    });

    const first = FakeEventSource.instances[0];
    first.emit("message", " partial", "42");
    first.onerror?.(new Event("error"));

    vi.advanceTimersByTime(20);
    expect(FakeEventSource.instances.length).toBe(2);
    expect(FakeEventSource.instances[1].url).toContain("lastEventId=42");

    FakeEventSource.instances[1].onerror?.(new Event("error"));
    vi.advanceTimersByTime(40);
    expect(errors.some((m) => m.includes("exhausted"))).toBe(true);

    client.abort();
    vi.useRealTimers();
  });
});
