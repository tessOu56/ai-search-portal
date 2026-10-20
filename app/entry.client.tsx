import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { readClientSentryDsn } from "~/lib/monitoring/env";

async function prepareClient(): Promise<void> {
  if (!readClientSentryDsn()) return;
  const { initSentryClient } = await import("~/lib/monitoring/sentry.client");
  initSentryClient();
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
void prepareClient();
