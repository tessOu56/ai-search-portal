# ESLint 不再依賴 Remix 官方 config

**類型**：reference | **權重**：3

T-2026-287 已把 `.eslintrc.cjs` 從 `@remix-run/eslint-config` 換成精簡組合：

- `eslint:recommended`
- `plugin:@typescript-eslint/recommended-type-checked`
- `plugin:react/recommended`
- `plugin:react-hooks/recommended`
- `plugin:jsx-a11y/recommended`

自訂規則（simple-import-sort、tailwind、promise、security、sonarjs、unicorn）仍保留。
