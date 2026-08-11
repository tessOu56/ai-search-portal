/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    // 關鍵：使用獨立的 tsconfig.eslint.json
    project: ["./tsconfig.eslint.json"],
    tsconfigRootDir: __dirname,
  },
  extends: [
    "@remix-run/eslint-config",                      // Remix 官方配置（已包含 react, jsx-a11y）
    "@remix-run/eslint-config/node",                 // Node.js 環境配置
    "plugin:@typescript-eslint/recommended-type-checked",  // 強化版型別檢查（需要 project）
    "plugin:promise/recommended",                    // Promise 最佳實務
    "plugin:security/recommended-legacy",            // 安全性規則（ESLint 8 相容）
    "plugin:sonarjs/recommended-legacy",             // Clean Code / 認知複雜度
    "plugin:tailwindcss/recommended",                // Tailwind CSS 規則
    "prettier",                                      // 必須放在最後
    // 注意：stylistic-type-checked 暫時移除，因為與 @remix-run/eslint-config 內部版本衝突
    // 如果未來需要，可以使用 package.json overrides 統一 @typescript-eslint 版本
  ],
  plugins: [
    // @typescript-eslint 和 react-hooks 已經在 @remix-run/eslint-config 中
    "unused-imports",
    "simple-import-sort",
    "tailwindcss",
    "promise",
    "security",
    "sonarjs",
    "unicorn",
  ],
  settings: {
    react: {
      version: "detect",
    },
    // Tailwind CSS 完整設定
    tailwindcss: {
      callees: ["classnames", "clsx", "ctl", "cn"],  // 支援常用的 class 合併函數
      config: require("path").join(__dirname, "tailwind.config.ts"),
      cssFiles: ["**/*.css", "!**/node_modules/**"],
      removeDuplicates: true,
      whitelist: [],  // 如果有自定義 class 前綴，在此加入
    },
  },
  rules: {
    // ===== Import 排序（取代 import/order）=====
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    // 關閉衝突的規則
    "import/order": "off",          // 必須關閉（與 simple-import-sort 衝突）
    "sort-imports": "off",          // ESLint core rule，避免重複排序邏輯

    // ===== 型別安全（全域 warn，在 overrides 中對 app/**/* 設 error）=====
    "@typescript-eslint/no-explicit-any": "warn",  // 全域先設為 warn

    // Remix 特定：避免忘記 await 非同步 actions/loaders
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-misused-promises": "error",

    // React Hooks：確保 Remix 的 dependency array 語法正確
    "react-hooks/exhaustive-deps": "warn",

    // 保留現有的其他規則
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
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn",
    "@typescript-eslint/no-unnecessary-condition": "warn",

    // React rules（這些可能會被 @remix-run/eslint-config 覆蓋，但保留以防萬一）
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/display-name": "off",
    "react/jsx-uses-react": "off",
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

    // React Hooks rules
    "react-hooks/rules-of-hooks": "error",

    // General rules
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-alert": "warn",
    "prefer-const": "warn",
    "no-var": "error",
    "object-shorthand": "warn",
    "prefer-arrow-callback": "warn",
    "prefer-template": "warn",

    // 複雜度與可讀性（Clean Code）
    "complexity": ["warn", { max: 15 }],
    "sonarjs/cognitive-complexity": ["warn", 15],
    "max-len": [
      "warn",
      {
        code: 100,
        ignoreUrls: true,
        ignoreComments: false,
        ignoreStrings: false,
        ignoreTemplateLiterals: false
      }
    ],

    // Unicorn: 精選規則，避免一次引入過多破壞性改動
    "unicorn/prevent-abbreviations": "off",
    "unicorn/filename-case": "off",
    "unicorn/no-null": "off",
    "unicorn/prefer-module": "off",
    "unicorn/prefer-optional-catch-binding": "warn",
    "unicorn/prefer-spread": "warn",
    "unicorn/prefer-string-slice": "warn",
    "unicorn/no-array-for-each": "warn",
  },
  // 分階段落地 no-explicit-any 的 overrides（真正分階段）
  overrides: [
    // 階段 1：核心程式碼嚴格執行 error
    {
      files: ["app/**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "error",  // 核心程式碼強制 error
      },
    },
    // 階段 2：測試檔案維持 warn（可選）
    {
      files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",  // 測試先 warning
      },
    },
    // 階段 3：配置檔案允許使用（但不會被 ignore）
    {
      files: ["*.config.{js,ts,cjs}", "**/*.config.{js,ts,cjs}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",  // 配置檔案允許 any
        "@typescript-eslint/no-var-requires": "off",  // 配置檔案可能使用 require
      },
    },
    // 階段 4：scripts 目錄維持 warn（如果有）
    {
      files: ["scripts/**/*.{ts,js}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
      },
    },
    // UI / routes：放寬 max-len（className 等常超長）、meta 的 ?? 防呆
    {
      files: ["app/**/*.{ts,tsx}"],
      rules: {
        "max-len": ["warn", { code: 200, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
        "@typescript-eslint/no-unnecessary-condition": "off",
      },
    },
    // i18n：translation key 替換為刻意行為，放寬 security 規則
    {
      files: ["app/shared/i18n/**/*.{ts,tsx}"],
      rules: {
        "security/detect-object-injection": "off",
        "security/detect-non-literal-regexp": "off",
        "security/detect-non-literal-fs-filename": "off",
      },
    },
    // Context pack loaders read paths under content/context-packs (resolved root).
    {
      files: [
        "app/shared/services/context-pack-loader.server.ts",
        "backend/src/lib/context-pack-loader.ts",
      ],
      rules: {
        "security/detect-non-literal-fs-filename": "off",
      },
    },
    // Labs: CLI / eval scripts intentionally log and write report files.
    {
      files: ["labs/**/*.{ts,tsx}"],
      rules: {
        "no-console": "off",
        "security/detect-non-literal-fs-filename": "off",
      },
    },
    // MSW handlers may compose multi-branch fixtures.
    {
      files: ["app/test/**/*.{ts,tsx}"],
      rules: {
        "sonarjs/cognitive-complexity": "off",
      },
    },
    // Guardrail patterns are reviewed regexes, not user input.
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
        "@typescript-eslint/no-unnecessary-condition": "off",
      },
    },
    // Monorepo：app 與 backend 不得互相 import
    {
      files: ["app/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["**/backend*", "**/backend/**", "../*backend*", "*/backend/*"],
                message:
                  "App must not import backend; use @ai-search-portal/contracts for API shapes only.",
              },
            ],
          },
        ],
      },
    },
    // repo-layers.md：features ↛ features（同 feature 請用相對路徑）
    {
      files: ["app/features/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["**/backend*", "**/backend/**", "../*backend*", "*/backend/*"],
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
    // repo-layers.md：components ↛ features
    {
      files: ["app/components/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["**/backend*", "**/backend/**", "../*backend*", "*/backend/*"],
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
      env: { node: true },
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["**/app/*", "**/app/**", "~/*"],
                message:
                  "Backend must not import Remix app code; use @ai-search-portal/contracts for API shapes only.",
              },
            ],
          },
        ],
      },
    },
    // Parity suite intentionally exercises Remix + Hono adapters side-by-side.
    {
      files: ["app/test/governance-contract-parity.test.ts"],
      rules: {
        "no-restricted-imports": "off",
      },
    },
    // 禁止在 app/shared/contracts 新增 *.contract.ts（契約僅在 packages/shared-contracts）
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
    // packages/shared-contracts：僅 Node／純 TS，放寬 React 相關
    {
      files: ["packages/shared-contracts/**/*.ts"],
      env: { node: true },
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
    // API 進程啟動訊息
    {
      files: ["backend/src/index.ts"],
      rules: {
        "no-console": "off",
      },
    },
  ],
  // 簡化 ignore：只使用 ignorePatterns，移除 --ignore-path .gitignore
  ignorePatterns: [
    "node_modules/",
    "build/",
    ".cache/",
    "public/build/",
    ".vercel/",
    "dist/",
    "*.min.js",
    "*.min.css",
    "*.d.ts",  // 已生成的型別定義檔案
    // 注意：*.config.* 不再 ignore，改用 overrides 放寬規則
  ],
};
