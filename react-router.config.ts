import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

import { sentryUploadEnabled } from "./app/lib/monitoring/env";

/**
 * vercelPreset must stay gated on VERCEL: it sets serverBundles and would
 * break `react-router-serve ./build/server/index.js` used by start/e2e.
 * On Vercel it writes `.vercel/react-router-build-result.json` for the
 * React Router builder — the dashboard Framework Preset must be
 * "react-router", not "remix", or `/` is a platform 404.
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
