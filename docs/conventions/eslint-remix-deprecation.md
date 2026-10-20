# ESLint 不再依賴 Remix 官方 config

**類型**：reference | **權重**：3

T-2026-287 已把 lint 從 `@remix-run/eslint-config` 換成精簡組合。現況為 ESLint 9 **flat config**（`eslint.config.js`）+ `typescript-eslint` type-checked：

- `@eslint/js` recommended
- `typescript-eslint` `recommendedTypeChecked`
- `eslint-plugin-react` recommended + `jsx-runtime`
- `eslint-plugin-react-hooks`（v7 plugin; Compiler rules deferred until Compiler is adopted）
- `eslint-plugin-jsx-a11y` recommended

自訂規則（simple-import-sort、tailwind、promise、security、sonarjs、unicorn）仍保留。
