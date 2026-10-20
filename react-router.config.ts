import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

import { sentryUploadEnabled } from "./app/lib/monitoring/env";

/**
 * T-2026-287 spike: Remix 2 → React Router 7 Framework Mode (Remix 3 rename).
 * RSC / `unstable_viteEnvironmentApi` stays off — not the production path.
 * Vite stays on 5.x; Tailwind stays on 3.x.
 *
 * Sentry source-map upload is a no-op unless SENTRY_AUTH_TOKEN + org/project
 * are present (never required for local / CI mock-first builds).
 */
export default {
  ssr: true,
  presets: process.env.VERCEL ? [vercelPreset()] : [],
  buildEnd: sentryUploadEnabled()
    ? async (...args) => {
        const { sentryOnBuildEnd } = await import("@sentry/react-router/vite");
        await sentryOnBuildEnd(...args);
      }
    : undefined,
} satisfies Config;
