# Repo 架構與分層

**類型**：reference | **權重**：1

本文件將 **Frontend Repository Architecture RFC** 對應到本專案實際目錄，作為「產品功能 vs 可複用組件 vs 應用基礎 vs 平台能力」的單一說明。開發階段以資料夾分層為主，Remix 技術整合（如 route 慣例）另見 [system-overview](system-overview.md) 與 Remix 文件。

---

## 1. 五層概覽

| Layer       | 責任                     | 本專案對應目錄                         |
| ----------- | ------------------------ | -------------------------------------- |
| **app**     | application shell        | `app/routes`、`app/root.tsx`、`app/entry.*`、layout/providers |
| **features**| product features         | `app/features/*`                       |
| **components** | reusable UI           | `app/components/*`（ui / shared / app 子層） |
| **services**| API / domain access      | `app/services/*`、`app/shared/*`（contracts, api, types, utils, services） |
| **infra**   | technical infrastructure | `app/infra/*`（可選，見下文）          |

---

## 2. App Layer（應用外殼）

**責任**：routing、global providers、application layout、bootstrap。

**本專案對應**：

- `app/routes/*` — Remix 路由
- `app/root.tsx` — 根 layout、ErrorBoundary、providers
- `app/entry.client.tsx`、`app/entry.server.tsx` — 應用啟動
- 若有獨立 `app/layout`、`app/providers` 可歸此層

**禁止**：feature 業務邏輯、API 呼叫、feature 狀態。

---

## 3. Features Layer（產品功能）

**責任**：以 **domain boundary** 切分產品功能；feature 可依賴 components、services，不依賴其他 feature。

**本專案對應**：`app/features/*`（例如 `dish`、`ingredient`、`recipe`、`vendor`）。

**單一 feature 典型結構**：

- `*.hooks.ts` — 前端 hook
- `*.server.ts` — server 端資料／業務
- `*.types.ts` — 模組型別
- 若有頁面／元件可放 `pages/`、`components/`（屬該 feature 內）

**原則**：feature 邊界切得好，codebase 才穩定；邊界定義見 [docs/product/](product/) 與產品規劃（如 Data Search、My Work Center、Data Management 等 domain）。

---

## 4. Components Layer（可複用 UI）

**責任**：跨 feature 的 UI 組件。

| 子層    | 說明                           | 本專案對應                     |
| ------- | ------------------------------ | ------------------------------ |
| **ui**  | primitive components           | `app/components/ui/*`          |
| **shared** | reusable interaction components | `app/components/shared/chat`、`app/components/shared/lui` 等 |
| **app** | application infrastructure UI  | `app/components/app/errorboundary` 等 |

---

## 5. Services Layer（API / 領域存取）

**責任**：HTTP client、API 存取、domain service 抽象。

**本專案對應**：

- `app/services/*` — 應用層整合與領域服務（如 `nutrition.server`、`lui.server`、`mock-items.server`）
- `app/shared/contracts` — Zod 契約（request/response schema）
- `app/shared/api` — 約定 API 路徑與使用方式（見 `app/shared/api/README.md`）
- `app/shared/services` — 跨模組共用 service（如 `domain.server`）
- `app/shared/types`、`app/shared/utils` — 共用型別與工具

**禁止**：React component、UI 邏輯。

---

## 6. Infra Layer（技術基礎設施）— 可選

**責任**：environment config、monitoring、logging、feature flags 等。

**是否要 infra**：視團隊需求而定。若目前無共用 logger / analytics / feature-flags，可暫不擴充；僅保留一層「可擴充點」即可。

**本專案對應**：

- 若有：`app/infra/*`（例如 `config`、`logger`、`analytics`、`feature-flags`）
- 若無：不在 `app/` 下建立 `infra`，或僅保留 `app/infra/README.md` 說明未來可放什麼，避免過早抽象。

---

## 7. 依賴方向（Dependency Rules）

```
ui           → 無（或僅依賴 infra 若需要）

shared       → ui

app components → ui / shared

features     → components, services

app (shell)  → features, components, services

services     → infra（若有）
```

**禁止**：

- features → features
- components → features
- services → components

---

## 8. 匯入範例

feature 內頁面或 hook：

```ts
import { Button } from '~/components/ui/Button'
import { ProductCard } from '~/components/shared/...'  // 若有 shared 元件
import { fetchDataset } from '~/services/...'          // 或透過 shared/api、useFetcher
```

---

## 9. 相關文件

- [clean-architecture](clean-architecture.md)：依賴由外而內、Spec→Contract→Mock→Test→UI
- [data-test-driven](../conventions/data-test-driven.md)：API 必有契約與 MSW handler
- [system-overview](system-overview.md)：Tech stack、目錄結構、Data Flow、Remix 相關說明
