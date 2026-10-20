import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

import { sentryUploadEnabled } from "./app/lib/monitoring/env";

/** Sentry source maps upload only when sentryUploadEnabled(). */
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
