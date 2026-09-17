# 套件與 React 支援度

**類型**：reference | **權重**：2

本專案以 **React 19** 為基準。新增或升級套件時，請確認其 React 支援度並更新本表。

---

## 專案基準

| 項目          | 版本                                                 |
| ------------- | ---------------------------------------------------- |
| **React**     | 19.2.8（見 package.json）                            |
| **React DOM** | 19.2.8                                               |
| **Router**    | React Router 7.18.4 Framework Mode（Remix 3 rename） |
| **Node**      | 22.x（engines）                                      |

升級 React 大版前，請依下方清單逐項確認 peer 與相容性，並跑 `pnpm run lint:ci`、`pnpm run test`。

RSC / `unstable_viteEnvironmentApi` is a spike only — not the production path (T-2026-287). Vite stays 5.x; Tailwind stays 3.x.

---

## 與 React 直接相關的套件

| 套件                                   | 用途       | React 支援／備註                       |
| -------------------------------------- | ---------- | -------------------------------------- |
| **react-router**                       | 路由與資料 | RR7 Framework Mode；peer React >=18    |
| **@radix-ui/react-scroll-area**        | UI 元件    | peer: ^16.8 \|\| ^17 \|\| ^18 \|\| ^19 |
| **@radix-ui/react-slot**               | 元件組合   | 同上，Radix 系列皆支援 16–19           |
| **react**, **react-dom**               | 核心       | 專案鎖定 19.2.x                        |
| **@types/react**, **@types/react-dom** | 型別       | 應與 react 大版一致（19.x）            |

Do not introduce a parallel UI kit for the React 19 bump — keep consuming `@is_tess/components` (peer `^18 \|\| ^19`).

---

## 測試與建置（間接依賴 React）

| 套件                            | 用途           | React 支援／備註                                                      |
| ------------------------------- | -------------- | --------------------------------------------------------------------- |
| **@testing-library/react**      | 元件測試       | v16 與 React 19 相容，需 peer @testing-library/dom                    |
| **@testing-library/user-event** | 使用者操作模擬 | 與 RTL 搭配，無額外 React 版本限制                                    |
| **vitest**                      | 測試執行       | 與 React 版本無直接 peer；透過 RTL 測 React 元件                      |
| **msw**                         | API mock       | 無 React peer；Node 18+、Fetch API，與 React 版本無關                 |
| **vite**                        | 建置           | 無 React peer；**stay on Vite 5.x** (T-2026-283 is a separate ticket) |

---

## 其他關鍵套件

| 套件                         | 用途        | React 支援／備註                                                 |
| ---------------------------- | ----------- | ---------------------------------------------------------------- |
| **lucide-react**             | 圖標        | 通常支援 React 16+；升級時查 peer                                |
| **class-variance-authority** | 樣式變體    | 無 React peer，僅型別與 runtime 工具                             |
| **zod**                      | 契約 schema | 無 React peer；TypeScript / 任何環境皆可                         |
| **tailwindcss**              | 樣式        | 無 React peer；**stay on Tailwind 3.x** (T-2026-281 is separate) |

---

## 維護方式

1. **新增依賴時**：查 npm 該套件 `peerDependencies` 是否含 `react` / `react-dom`，並在本文「與 React 直接相關」或「其他」補一列。
2. **升級 React 時**：執行 `pnpm run check:peers`（即 `pnpm ls react react-dom`），檢查 peer 衝突；依本表與官方遷移指南逐項驗證。
3. **升級 Radix / React Router / RTL 時**：查該套件 changelog 的 React 要求，並更新本表與 [system-overview](../architecture/system-overview.md) 的 Tech Stack。

---

## 參考

- [system-overview](../architecture/system-overview.md)：Tech Stack 寫明 React Router 7 Framework Mode + React 19
- **package.json**：`engines.node`、`dependencies.react` 為單一來源
