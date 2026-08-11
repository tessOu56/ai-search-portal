/**
 * Minimal web-vitals reporter for Gate 1 Perf (T-2026-058), extended for the
 * local `/vitals` panel (T-2026-115, Pillar 4).
 *
 * Every metric is always mirrored into the in-memory/sessionStorage store
 * (`vitals-store.ts`) so `/vitals` works fully offline, without a backend.
 * The optional POST to a PostHog-style endpoint stays gated behind
 * `VITE_ANALYTICS_ENABLED=1` as before.
 */

import type { WebVitalName, WebVitalRating } from "@ai-search-portal/contracts";
import { type Metric, onCLS, onINP, onLCP } from "web-vitals";

import { recordVital } from "./vitals-store";

export type WebVitalPayload = {
  name: "LCP" | "INP" | "CLS";
  value: number;
  id: string;
  rating?: string;
  navigationType?: string;
  at: string;
};

function toStoredName(name: Metric["name"]): WebVitalName | null {
  return name === "LCP" || name === "INP" || name === "CLS" ? name : null;
}

type AnalyticsEnv = {
  VITE_ANALYTICS_ENABLED?: string;
  VITE_ANALYTICS_ENDPOINT?: string;
};

function readAnalyticsEnv(): AnalyticsEnv {
  const meta = import.meta as ImportMeta & { env?: AnalyticsEnv };
  return meta.env ?? {};
}

function endpoint(): string | null {
  if (typeof window === "undefined") return null;
  const env = readAnalyticsEnv();
  if (env.VITE_ANALYTICS_ENABLED !== "1") return null;
  return env.VITE_ANALYTICS_ENDPOINT ?? "http://localhost:19000";
}

export async function reportWebVital(metric: Metric): Promise<void> {
  const url = endpoint();
  if (!url) return;
  const body: WebVitalPayload = {
    name: metric.name as WebVitalPayload["name"],
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    navigationType: metric.navigationType,
    at: new Date().toISOString(),
  };
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
      mode: "cors",
    });
  } catch {
    // Non-blocking: analytics must never break UX
  }
}

function mirrorToStore(metric: Metric): void {
  const name = toStoredName(metric.name);
  if (!name || typeof window === "undefined") return;
  const rating: WebVitalRating = metric.rating;
  recordVital({
    name,
    value: metric.value,
    rating,
    route: window.location.pathname,
    at: new Date().toISOString(),
  });
}

function onVital(metric: Metric): void {
  mirrorToStore(metric);
  void reportWebVital(metric);
}

/** Call once from client entry / root. Safe no-op when disabled. */
export function startWebVitalsReporting(): void {
  if (typeof window === "undefined") return;
  onLCP(onVital);
  onINP(onVital);
  onCLS(onVital);
}
