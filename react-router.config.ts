import type { Config } from "@react-router/dev/config";

import { sentryUploadEnabled } from "./app/lib/monitoring/env";

const useNodeBuild = process.env.BUILD_TARGET === "node";

/**
 * Default build targets Cloudflare Workers (`@cloudflare/vite-plugin`).
 * Docker / `react-router-serve` uses `BUILD_TARGET=node` via `pnpm run build:node`.
 */
export default {
  ssr: true,
  future: useNodeBuild
    ? {}
    : {
        v8_viteEnvironmentApi: true,
      },
  buildEnd: sentryUploadEnabled()
    ? async (...args) => {
        const { sentryOnBuildEnd } = await import("@sentry/react-router/vite");
        await sentryOnBuildEnd(...args);
      }
    : undefined,
} satisfies Config;
