import * as Sentry from "@sentry/react-router";

import { readClientSentryDsn, readClientTracesSampleRate } from "./env";

let started = false;

export function initSentryClient(): void {
  if (started || typeof window === "undefined") return;
  const dsn = readClientSentryDsn();
  if (!dsn) return;
  started = true;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: readClientTracesSampleRate(),
    integrations: [Sentry.reactRouterTracingIntegration()],
  });
}
