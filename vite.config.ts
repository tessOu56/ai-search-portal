import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const isTest = mode === "test" || process.env.VITEST;
  return {
    plugins: [
      // React Router plugin is disabled in test so app/test/setup.ts can import
      // msw/server without triggering the framework server-only check.
      ...(isTest ? [] : [reactRouter()]),
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
