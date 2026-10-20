import type { WebVitalName, WebVitalRating } from "@ai-search-portal/contracts";
import { type Metric, onCLS, onINP, onLCP } from "web-vitals";

import { productAnalyticsEndpoint } from "./product-events";
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

export async function reportWebVital(metric: Metric): Promise<void> {
  const url = productAnalyticsEndpoint();
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
    /* telemetry is best-effort */
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

export function startWebVitalsReporting(): void {
  if (typeof window === "undefined") return;
  onLCP(onVital);
  onINP(onVital);
  onCLS(onVital);
}
