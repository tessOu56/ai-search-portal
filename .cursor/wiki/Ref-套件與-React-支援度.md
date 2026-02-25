# Ref-套件與 React 支援度

本專案以 **React 18** 為基準。新增或升級套件時，請確認其 React 支援度並更新本表。

---

## 專案基準

| 項目          | 版本                       |
| ------------- | -------------------------- |
| **React**     | ^18.3.1（見 package.json） |
| **React DOM** | ^18.3.1                    |
| **Node**      | >= 20（engines）           |

升級 React 大版（如 18→19）前，請依下方清單逐項確認 peer 與相容性，並跑 `npm run lint:ci`、`npm run test`。

---

## 與 React 直接相關的套件

| 套件                                   | 用途       | React 支援／備註                       |
| -------------------------------------- | ---------- | -------------------------------------- |
| **@remix-run/react**                   | 路由與資料 | Remix 2 要求 React 18                  |
| **@radix-ui/react-scroll-area**        | UI 元件    | peer: ^16.8 \|\| ^17 \|\| ^18 \|\| ^19 |
| **@radix-ui/react-slot**               | 元件組合   | 同上，Radix 系列皆支援 16–19           |
| **react**, **react-dom**               | 核心       | 專案鎖定 ^18.x                         |
| **@types/react**, **@types/react-dom** | 型別       | 應與 react 大版一致（18.x）            |

---

## 測試與建置（間接依賴 React）

| 套件                            | 用途           | React 支援／備註                                                       |
| ------------------------------- | -------------- | ---------------------------------------------------------------------- |
| **@testing-library/react**      | 元件測試       | v13+ 要求 React 18；v16 與 React 18 相容，需 peer @testing-library/dom |
| **@testing-library/user-event** | 使用者操作模擬 | 與 RTL 搭配，無額外 React 版本限制                                     |
| **vitest**                      | 測試執行       | 與 React 版本無直接 peer；透過 RTL 測 React 元件                       |
| **msw**                         | API mock       | 無 React peer；Node 18+、Fetch API，與 React 版本無關                  |
| **vite**                        | 建置           | 無 React peer；Remix 負責 React 整合                                   |

---

## 其他關鍵套件

| 套件                         | 用途        | React 支援／備註                         |
| ---------------------------- | ----------- | ---------------------------------------- |
| **lucide-react**             | 圖標        | 通常支援 React 16+；升級時查 peer        |
| **class-variance-authority** | 樣式變體    | 無 React peer，僅型別與 runtime 工具     |
| **zod**                      | 契約 schema | 無 React peer；TypeScript / 任何環境皆可 |
| **tailwindcss**              | 樣式        | 無 React peer                            |

---

## 維護方式

1. **新增依賴時**：查 npm 該套件 `peerDependencies` 是否含 `react` / `react-dom`，並在本文「與 React 直接相關」或「其他」補一列。
2. **升級 React 時**：執行 `npm run check:peers`（即 `npm ls react react-dom`），檢查 peer 衝突；依本表與官方遷移指南逐項驗證。
3. **升級 Radix / Remix / RTL 時**：查該套件 changelog 的 React 要求，並更新本表與 `docs/ARCHITECTURE.md` 的 Tech Stack。

---

## 參考

- **docs/ARCHITECTURE.md**：Tech Stack 寫明 Remix v2 + React 18。
- **package.json**：`engines.node`、`dependencies.react` 為單一來源。
