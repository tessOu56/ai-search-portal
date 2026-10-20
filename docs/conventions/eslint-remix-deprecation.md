# ESLint 不再依賴 Remix 官方 config

**類型**：reference | **權重**：3

T-2026-287 已把 Remix 官方 config 換成精簡組合。ESLint 9 起設定在 `eslint.config.js`（flat config）：

- `@eslint/js` recommended
- `typescript-eslint` recommendedTypeChecked
- `eslint-plugin-react` recommended + jsx-runtime
- `eslint-plugin-react-hooks` flat recommended（core hooks rules; React Compiler 規則維持關閉）
- `eslint-plugin-jsx-a11y` recommended

自訂規則（simple-import-sort、tailwind、promise、security、sonarjs、unicorn）仍保留。
