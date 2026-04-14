# Remix ESLint 棄用說明

**類型**：reference | **權重**：3

## 警告訊息是什麼？

執行 `pnpm run lint` 時若看到：

```text
REMIX FUTURE CHANGE: The `@remix-run/eslint-config` package is deprecated
and will not be included in React Router v7. We recommend moving towards
a streamlined ESLint config such as the ones included in the Remix templates.
```

代表目前專案使用的 **`@remix-run/eslint-config`** 已被 Remix 標記為棄用，且 **React Router v7 將不再內含此套件**。

## 為什麼棄用？

- Remix 團隊認為 ESLint 設定屬於「各專案自己的選擇」，不適合由 Remix 核心提供一套固定配置。
- 建議改由各專案自行組合 **eslint 官方與各 plugin 的 recommended**（例如 TypeScript、React、jsx-a11y），不再依賴 Remix 的集中式 config。

## 現在需要做什麼？

- **短期**：**不用立刻改**。現有 `.eslintrc.cjs` 仍可正常使用，lint 照常跑；只是會看到上述警告。
- **中長期**：升級到 React Router v7 前，規劃把 ESLint 改為「精簡版」：
  - 移除 `extends: ["@remix-run/eslint-config", "@remix-run/eslint-config/node"]`。
  - 改為直接 extend：`eslint:recommended`、`plugin:@typescript-eslint/recommended`、`plugin:react/recommended`、`plugin:react-hooks/recommended`、`plugin:jsx-a11y/recommended` 等（可參考 [Remix 官方 template 的 .eslintrc.cjs](https://github.com/remix-run/remix/blob/main/templates/remix/.eslintrc.cjs)）。
  - 現有自訂規則（simple-import-sort、tailwind、promise、security 等）可保留，只替換「Remix 那兩行」的來源。

## 參考

- Remix 說明：<https://github.com/remix-run/remix/blob/v2/templates/remix/.eslintrc.cjs>
- 若日後要遷移，可依 [Code Review 規範](../code-review-spec.md) 在變更後更新本文件與 `package.json` 依賴。
