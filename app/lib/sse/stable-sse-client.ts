/**
 * Shared stable SSE client: reconnect, event ordering, abort.
 * Extracted for T-2026-060 — ChatInterface may adopt later without breaking chat.
 */

export type StableSseMessage = {
  id?: string;
  event: string;
  data: string;
  /** Monotonic sequence assigned by the client for ordering */
  seq: number;
};

export type StableSseClientOptions = {
  url: string;
  /** Named SSE event types to listen for (default: message only via onmessage) */
  eventTypes?: string[];
  /** Max reconnect attempts after error/close before giving up (default 5) */
  maxRetries?: number;
  /** Base delay ms for exponential backoff (default 250) */
  retryBaseMs?: number;
  onEvent?: (message: StableSseMessage) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  /** Called when reconnect budget is exhausted */
  onExhausted?: () => void;
  /** Optional fetch/EventSource factory for tests */
  createEventSource?: (url: string) => EventSource;
};

export type StableSseClient = {
  abort: () => void;
  /** Last seen event id (Last-Event-ID) */
  lastEventId: () => string | null;
};

function withLastEventId(url: string, lastEventId: string | null): string {
  if (!lastEventId) return url;
  const u = new URL(url, "http://local.invalid");
  u.searchParams.set("lastEventId", lastEventId);
  // Preserve relative urls when input was relative
  if (!/^https?:\/\//i.test(url)) {
    return `${u.pathname}${u.search}${u.hash}`;
  }
  return u.toString();
}

/**
 * Open an EventSource with reconnect + Last-Event-ID + client-side seq ordering.
 * Duplicate event ids are dropped. Out-of-order delivery is re-sequenced via seq.
 */
export function createStableSseClient(
  options: StableSseClientOptions
): StableSseClient {
  const maxRetries = options.maxRetries ?? 5;
  const retryBaseMs = options.retryBaseMs ?? 250;
  const eventTypes = options.eventTypes ?? [];
  let closed = false;
  let retries = 0;
  let seq = 0;
  let lastEventId: string | null = null;
  let source: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const seenIds = new Set<string>();

  const createSource =
    options.createEventSource ?? ((url: string) => new EventSource(url));

  const clearTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const attach = (es: EventSource) => {
    es.onopen = () => {
      retries = 0;
      options.onOpen?.();
    };

    const handle = (eventName: string) => (ev: MessageEvent) => {
      const id =
        typeof ev.lastEventId === "string" && ev.lastEventId
          ? ev.lastEventId
          : undefined;
      if (id) {
        if (seenIds.has(id)) return;
        seenIds.add(id);
        lastEventId = id;
      }
      seq += 1;
      options.onEvent?.({
        id,
        event: eventName,
        data: String(ev.data ?? ""),
        seq,
      });
    };

    es.onmessage = handle("message");
    for (const type of eventTypes) {
      es.addEventListener(type, handle(type) as EventListener);
    }

    es.onerror = () => {
      es.close();
      if (closed) return;
      if (retries >= maxRetries) {
        options.onExhausted?.();
        options.onError?.(new Error("SSE reconnect exhausted"));
        return;
      }
      const delay = retryBaseMs * 2 ** retries;
      retries += 1;
      clearTimer();
      reconnectTimer = setTimeout(() => {
        if (closed) return;
        open();
      }, delay);
    };
  };

  const open = () => {
    if (closed) return;
    source?.close();
    const url = withLastEventId(options.url, lastEventId);
    source = createSource(url);
    attach(source);
  };

  open();

  return {
    abort: () => {
      closed = true;
      clearTimer();
      source?.close();
      source = null;
    },
    lastEventId: () => lastEventId,
  };
}

/**
 * Pure helper for tests: merge buffered events by seq, drop duplicate ids.
 */
export function orderStableSseEvents(
  events: StableSseMessage[]
): StableSseMessage[] {
  const byId = new Map<string, StableSseMessage>();
  const withoutId: StableSseMessage[] = [];
  for (const e of events) {
    if (e.id) {
      if (!byId.has(e.id)) byId.set(e.id, e);
    } else {
      withoutId.push(e);
    }
  }
  return [...byId.values(), ...withoutId].sort((a, b) => a.seq - b.seq);
}
