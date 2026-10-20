import path from "node:path";

import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import promise from "eslint-plugin-promise";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import security from "eslint-plugin-security";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sonarjs from "eslint-plugin-sonarjs";
import tailwindcss from "eslint-plugin-tailwindcss";
import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/node_modules/**",
    "**/build/**",
    "**/.cache/**",
    "public/build/**",
    ".vercel/**",
    ".react-router/**",
    "**/dist/**",
    "**/*.min.js",
    "**/*.min.css",
    "**/*.d.ts",
    "**/*.mjs",
    "tools/**",
    "docs/.vitepress/**",
    ".lintstagedrc.cjs",
    "packages/shared-contracts/src/generated/**",
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  jsxA11y.flatConfigs.recommended,
  promise.configs["flat/recommended"],
  security.configs.recommended,
  sonarjs.configs.recommended,
  ...tailwindcss.configs["flat/recommended"],
  {
    plugins: {
      "react-hooks": reactHooks,
      "simple-import-sort": simpleImportSort,
      unicorn,
      "unused-imports": unusedImports,
    },
    settings: {
      react: {
        version: "detect",
      },
      tailwindcss: {
        callees: ["classnames", "clsx", "ctl", "cn"],
        config: path.join(import.meta.dirname, "tailwind.config.ts"),
        cssFiles: ["**/*.css", "!**/node_modules/**"],
        removeDuplicates: true,
        whitelist: [],
      },
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "sort-imports": "off",

      "@typescript-eslint/no-explicit-any": "warn",

      // Remix eslint-config previously masked these type-checked rules on
      // router `any` loader data. Keep them off so RR7 Framework Mode lint
      // matches the previous Remix 2 gate (T-2026-287).
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "tailwindcss/no-unnecessary-arbitrary-value": "off",
      "tailwindcss/no-custom-classname": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          allow: [
            { from: "lib", name: "Response" },
            { from: "package", name: "redirect", package: "react-router" },
            { from: "package", name: "data", package: "react-router" },
          ],
        },
      ],

      // Current react-hooks (v7) recommended also enables React Compiler
      // rules. Keep the previous hooks gate until Compiler is adopted.
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",

      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": [
        "warn",
        {
          ignorePrimitives: { string: true },
          ignoreIfStatements: true,
        },
      ],
      "@typescript-eslint/prefer-optional-chain": [
        "warn",
        { requireNullish: true },
      ],
      "@typescript-eslint/no-unnecessary-condition": "warn",
      // FormData.get / MCP args are string | File | unknown; callers already
      // coerce with String(...). Same family as the Remix loader `any` offs.
      "@typescript-eslint/no-base-to-string": "off",
      "sonarjs/no-duplicate-string": ["error", { threshold: 5 }],

      "react/prop-types": "off",
      "react/display-name": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-pascal-case": "error",
      "react/no-array-index-key": "warn",
      "react/no-danger": "warn",
      "react/no-deprecated": "warn",
      "react/no-direct-mutation-state": "error",
      "react/no-unknown-property": "error",
      "react/self-closing-comp": "warn",

      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "warn",
      "prefer-const": "warn",
      "no-var": "error",
      "object-shorthand": "warn",
      "prefer-arrow-callback": "warn",
      "prefer-template": "warn",

      complexity: ["warn", { max: 15 }],
      "sonarjs/cognitive-complexity": ["warn", 15],
      "max-len": [
        "warn",
        {
          code: 100,
          ignoreUrls: true,
          ignoreComments: false,
          ignoreStrings: false,
          ignoreTemplateLiterals: false,
        },
      ],

      "unicorn/prevent-abbreviations": "off",
      "unicorn/filename-case": "off",
      "unicorn/no-null": "off",
      "unicorn/prefer-module": "off",
      "unicorn/prefer-optional-catch-binding": "warn",
      "unicorn/prefer-spread": "warn",
      "unicorn/prefer-string-slice": "warn",
      "unicorn/no-array-for-each": "warn",
    },
  },
  prettier,
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "max-len": [
        "warn",
        {
          code: 200,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      complexity: "off",
      "sonarjs/cognitive-complexity": "off",
    },
  },
  {
    files: ["*.config.{js,ts,cjs}", "**/*.config.{js,ts,cjs}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "sonarjs/no-duplicate-string": "off",
    },
  },
  {
    files: ["scripts/**/*.{ts,js}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["app/shared/i18n/**/*.{ts,tsx}"],
    rules: {
      "security/detect-object-injection": "off",
      "security/detect-non-literal-regexp": "off",
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: [
      "app/shared/services/context-pack-loader.server.ts",
      "backend/src/lib/context-pack-loader.ts",
      "packages/agent-core/src/rag/local-store.ts",
    ],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["labs/**/*.{ts,tsx}"],
    rules: {
      "no-console": "off",
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["app/test/**/*.{ts,tsx}"],
    rules: {
      "sonarjs/cognitive-complexity": "off",
      complexity: "off",
    },
  },
  {
    files: [
      "app/test/live-surface-drift.test.ts",
      "app/components/shared/chat/AiFallbackPanel.tsx",
    ],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
    },
  },
  {
    files: ["packages/agent-core/src/tools/guardrails.ts"],
    rules: {
      "security/detect-unsafe-regex": "off",
    },
  },
  {
    files: ["packages/agent-core/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
  {
    files: ["packages/agent-core/src/stream.ts"],
    rules: {
      "sonarjs/cognitive-complexity": "off",
      complexity: "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
  {
    files: [
      "packages/agent-core/src/knowledge-links.ts",
      "packages/agent-core/src/rag/local-store.ts",
      "app/components/shared/chat/AssistantTurn.tsx",
      "app/routes/metadata.$assetId.tsx",
      "app/shared/services/knowledge-chunks.ts",
    ],
    rules: {
      "sonarjs/cognitive-complexity": "off",
      complexity: "off",
    },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/backend*",
                "**/backend/**",
                "../*backend*",
                "*/backend/*",
              ],
              message:
                "App must not import backend; use @ai-search-portal/contracts for API shapes only.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/backend*",
                "**/backend/**",
                "../*backend*",
                "*/backend/*",
              ],
              message:
                "App must not import backend; use @ai-search-portal/contracts for API shapes only.",
            },
            {
              group: ["~/features/*", "~/features/**"],
              message:
                "Features must not import other features (repo-layers.md). Use relative imports within the same feature, or move shared URLs/UI to app/shared or app/components.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/backend*",
                "**/backend/**",
                "../*backend*",
                "*/backend/*",
              ],
              message:
                "App must not import backend; use @ai-search-portal/contracts for API shapes only.",
            },
            {
              group: ["~/features/*", "~/features/**"],
              message:
                "Components must not import features (repo-layers.md). Move shared helpers to app/shared (e.g. navigation) or pass data from routes/features.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["backend/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/app/*", "**/app/**", "~/*"],
              message:
                "Backend must not import app code; use @ai-search-portal/contracts for API shapes only.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/test/governance-contract-parity.test.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["app/shared/contracts/**/*.contract.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message:
            "Do not add *.contract.ts under app/shared/contracts. Define API contracts only in packages/shared-contracts.",
        },
      ],
    },
  },
  {
    files: ["packages/shared-contracts/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["backend/src/index.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.{js,cjs,mjs}"],
    ...tseslint.configs.disableTypeChecked,
  }
);
