import * as Sentry from "@sentry/react-router";

import { readServerSentryDsn, readServerTracesSampleRate } from "./env";

let started = false;

export function initSentryServer(): typeof Sentry | null {
  const dsn = readServerSentryDsn();
  if (!dsn) return null;
  if (!started) {
    started = true;
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: readServerTracesSampleRate(),
    });
  }
  return Sentry;
}
