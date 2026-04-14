import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const isTest = mode === "test" || process.env.VITEST;
  return {
    plugins: [
      // Remix plugin 在 test 時不啟用，避免 app/test/setup.ts 引用 msw/server 觸發 server-only 檢查
      ...(isTest
        ? []
        : [
            remix({
              future: {
                v3_fetcherPersist: true,
                v3_relativeSplatPath: true,
                v3_throwAbortReason: true,
              },
            }),
          ]),
      tsconfigPaths(),
    ],
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


