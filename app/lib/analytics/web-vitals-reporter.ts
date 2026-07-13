/**
 * Minimal web-vitals reporter for Gate 1 Perf (T-2026-058).
 * Posts closed metric payloads to a configurable endpoint (PostHog stub or proxy).
 */

import { type Metric, onCLS, onINP, onLCP } from "web-vitals";

export type WebVitalPayload = {
  name: "LCP" | "INP" | "CLS";
  value: number;
  id: string;
  rating?: string;
  navigationType?: string;
  at: string;
};

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

function onVital(metric: Metric): void {
  void reportWebVital(metric);
}

/** Call once from client entry / root. Safe no-op when disabled. */
export function startWebVitalsReporting(): void {
  if (typeof window === "undefined") return;
  onLCP(onVital);
  onINP(onVital);
  onCLS(onVital);
}
