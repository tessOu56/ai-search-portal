/**
 * Typed product-analytics layer. Closed schemas only — no query text.
 * No-op unless VITE_ANALYTICS_ENABLED=1 (same gate as web-vitals POST).
 */

import {
  type AnalyticsEventContract,
  analyticsEventSchema,
} from "@ai-search-portal/contracts";

const SESSION_KEY = "ai-search-portal:analytics-session";

type AnalyticsEnv = {
  VITE_ANALYTICS_ENABLED?: string;
  VITE_ANALYTICS_ENDPOINT?: string;
};

type SearchSubmittedInput = {
  surface: "chat" | "catalog_search";
  queryLength: number;
};

type AnswerRenderedInput = {
  surface: "chat";
  hasSummary: boolean;
  sourceCount: number;
  durationMs: number;
};

type CitationClickedInput = {
  surface: "chat";
  kind: "internal" | "external";
  index: number;
};

function processEnv(name: keyof AnalyticsEnv): string | undefined {
  if (typeof process === "undefined") return undefined;
  if (name === "VITE_ANALYTICS_ENABLED") {
    return process.env.VITE_ANALYTICS_ENABLED;
  }
  return process.env.VITE_ANALYTICS_ENDPOINT;
}

function readAnalyticsEnv(): AnalyticsEnv {
  const meta = import.meta as ImportMeta & { env?: AnalyticsEnv };
  const fromMeta = meta.env ?? {};
  return {
    VITE_ANALYTICS_ENABLED:
      fromMeta.VITE_ANALYTICS_ENABLED ?? processEnv("VITE_ANALYTICS_ENABLED"),
    VITE_ANALYTICS_ENDPOINT:
      fromMeta.VITE_ANALYTICS_ENDPOINT ?? processEnv("VITE_ANALYTICS_ENDPOINT"),
  };
}

export function isProductAnalyticsEnabled(): boolean {
  return readAnalyticsEnv().VITE_ANALYTICS_ENABLED === "1";
}

function analyticsEndpoint(): string | null {
  if (typeof window === "undefined" || !isProductAnalyticsEnabled()) {
    return null;
  }
  return readAnalyticsEnv().VITE_ANALYTICS_ENDPOINT ?? "http://localhost:19000";
}

function sessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return undefined;
  }
}

function baseFields() {
  return {
    eventId: crypto.randomUUID(),
    at: new Date().toISOString(),
    sessionId: sessionId(),
  };
}

export function trackProductEvent(event: AnalyticsEventContract): void {
  const parsed = analyticsEventSchema.safeParse(event);
  if (!parsed.success) return;
  const url = analyticsEndpoint();
  if (!url) return;
  try {
    void fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      keepalive: true,
      mode: "cors",
    });
  } catch {
    // Telemetry must never break UX.
  }
}

export function trackSearchSubmitted(input: SearchSubmittedInput): void {
  trackProductEvent({
    ...baseFields(),
    name: "search_submitted",
    surface: input.surface,
    properties: { queryLength: input.queryLength },
  });
}

export function trackAnswerRendered(input: AnswerRenderedInput): void {
  trackProductEvent({
    ...baseFields(),
    name: "answer_rendered",
    surface: input.surface,
    properties: {
      hasSummary: input.hasSummary,
      sourceCount: input.sourceCount,
      durationMs: input.durationMs,
    },
  });
}

export function trackCitationClicked(input: CitationClickedInput): void {
  trackProductEvent({
    ...baseFields(),
    name: "citation_clicked",
    surface: input.surface,
    properties: { kind: input.kind, index: input.index },
  });
}
