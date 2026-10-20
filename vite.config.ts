import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { sentryUploadEnabled } from "./app/lib/monitoring/env";

export default defineConfig(async (config) => {
  const isTest = config.mode === "test" || process.env.VITEST;
  const uploadSentry = !isTest && sentryUploadEnabled();
  const sentryConfig = {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    sourcemaps: {
      filesToDeleteAfterUpload: ["./build/**/*.map"],
    },
  };
  const sentryPlugins = uploadSentry
    ? await (
        await import("@sentry/react-router/vite")
      ).sentryReactRouter(sentryConfig, config)
    : [];
  return {
    ...(uploadSentry ? { sentryConfig } : {}),
    build: {
      sourcemap: uploadSentry ? ("hidden" as const) : false,
    },
    plugins: [
      // React Router plugin is disabled in test so app/test/setup.ts can import
      // msw/server without triggering the framework server-only check.
      ...(isTest ? [] : [reactRouter()]),
      tsconfigPaths(),
      ...sentryPlugins,
    ],
    // @is_tess/components dist uses extensionless `./ux` re-exports that Node ESM
    // rejects when left external — bundle into SSR (also pulls tokens CSS deps).
    ssr: {
      noExternal: ["@is_tess/components", "@is_tess/tokens"],
    },
    test: {
      globals: true,
      include: ["app/**/*.{test,spec}.{ts,tsx}"],
      environment: "jsdom",
      environmentOptions: {
        jsdom: { url: "http://localhost" },
      },
      setupFiles: ["./app/test/setup.ts"],
      css: true,
      reporters:
        process.env.CI === "true"
          ? [
              "default",
              ["json", { outputFile: "reports/vitest-results.json" }],
              ["junit", { outputFile: "reports/junit.xml" }],
            ]
          : ["default"],
      coverage: {
        provider: "v8",
        reporter: ["text", "text-summary", "json-summary"],
        reportsDirectory: "./coverage",
        all: true,
        include: ["app/**/*.{ts,tsx}"],
        exclude: [
          "app/**/*.{test,spec}.{ts,tsx}",
          "app/test/**",
          "app/entry.client.tsx",
          "app/entry.server.tsx",
        ],
      },
    },
  };
});
