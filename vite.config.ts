import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { vercelPreset } from "@vercel/remix/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals({ nativeFetch: true });

export default defineConfig(({ mode }) => {
  const isTest = mode === "test" || process.env.VITEST;
  return {
    plugins: [
      // Remix plugin 在 test 時不啟用，避免 app/test/setup.ts 引用 msw/server 觸發 server-only 檢查
      ...(isTest
        ? []
        : [
            remix({
              presets: process.env.VERCEL ? [vercelPreset()] : [],
              ignoredRouteFiles: ["**/.*", "**/*.test.*", "**/*.spec.*"],
              future: {
                v3_fetcherPersist: true,
                v3_relativeSplatPath: true,
                v3_throwAbortReason: true,
              },
            }),
          ]),
      tsconfigPaths(),
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
    },
  };
});


