import {
  type AnalyticsEventContract,
  analyticsEventSchema,
} from "@ai-search-portal/contracts";

import { isProductAnalyticsEnabled, productAnalyticsEndpoint } from "./env";

export { isProductAnalyticsEnabled, productAnalyticsEndpoint };

const SESSION_KEY = "ai-search-portal:analytics-session";

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
  const url = productAnalyticsEndpoint();
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
    /* telemetry is best-effort */
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
