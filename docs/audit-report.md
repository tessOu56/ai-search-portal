# 專案盤查報告

**類型**：report | **權重**：3

本文件為依 [Code Review 規範](code-review-spec.md) 與實際目錄／程式所做的盤查結果，供後續階段對齊與改進參考。

**盤查日期**：2026-03（依實際執行日更新）

---

## 1. 檢查結果摘要

| 項目 | 結果 | 說明 |
|------|------|------|
| lint:filenames | ✅ 通過 | 資料夾小寫、元件檔 PascalCase 符合 |
| lint:handlers | ✅ 通過 | 需 handler 的 API（/api/items）皆有對應 MSW handler |
| typecheck | ✅ 通過 | 無型別錯誤 |
| lint (ESLint) | ✅ 通過 | 無違規 |
| test | ✅ 通過 | 契約單元 + Items API 整合（MSW mock） |

---

## 2. 結構與文件對齊

### 2.1 目錄結構

- **app/**：routes、features、components（ui / shared / app）、services、shared、infra、test 齊全；符合 [repo-layers](architecture/repo-layers.md)。
- **docs/**：architecture、conventions、runbooks、product 與 [docs/README](README.md) 一覽一致；根目錄 stub（ARCHITECTURE、CONVENTIONS、DEVELOPMENT）連結正確。
- **specs/**：api/（handler-mapping、contract-schema）、schemas/（README）存在。

### 2.2 對齊狀態

- **app/infra/README.md**：連結 [docs/architecture/repo-layers.md](architecture/repo-layers.md)，說明 infra 層對應。
- **docs/CONVENTIONS.md**：含「錯誤與邊界處理」等條目，見 [error-handling](conventions/error-handling.md)。

### 2.3 文件命名釐清

- **docs/CAPABILITIES.md**：內容為「專案能力現況」（版號、多語系、無障礙），與根目錄 **AGENT_CAPABILITIES.md**（agent 能力邊界）不同，兩者並存無衝突；必要時可在 CAPABILITIES.md 開頭註明「非 agent 能力檔，agent 能力見根目錄 AGENT_CAPABILITIES.md」。

---

## 3. 契約與 API

### 3.1 路徑與 routes 對照

- **paths.ts**：涵蓋 `/api/items`、`/api/chat`、`/api/locale`、`/api/release-notes`、`/api/site-meta` 及 dishes/ingredients/recipes/vendors/dish-vendors；與 [handler-mapping](../specs/api/handler-mapping.md) 表一致。
- **實際 route 檔案**：`api.items`、`api.items.$itemId`、`api.chat`、`api.locale`、`api.release-notes`、`api.site-meta`。**dishes / ingredients / recipes / vendors** 目前**無**對應 `api.*` route，handler-mapping 已註「待補」；若前端 hooks 已使用這些路徑，需補 route 或改為 mock-only 並在文件註明。

### 3.2 資料請求方式

- **Component 內**：僅見 `ChatInterface` 使用 `EventSource(apiChatQuery(query))`，路徑來自 `paths.ts`，無硬編碼、無直接 `fetch(url)`，符合規範。

### 3.3 MSW 與 lint-handlers

- **lint-handlers**：僅要求 `/api/items` 有 handler；chat、locale、release-notes、site-meta 為 EXCLUDED。目前 handlers.ts 涵蓋 items CRUD，通過檢查。

---

## 4. 依賴與慣例

- **.cursor/rules**：project-standards、collaboration-architecture、data-test-driven 皆指向 AGENTS.md / AGENT_CAPABILITIES.md 與 docs/，符合 tool adapter 角色。
- **AGENTS.md**：含 workflow、Code Review 節（連結 code-review-spec、code-review/）、能力邊界；與 AGENT_CAPABILITIES.md、docs 一致。當期 CR 報告與議題見 [code-review/REPORT.md](../code-review/REPORT.md)、[code-review/issues.md](../code-review/issues.md)。
- **CONVENTIONS / Code Review**：CONVENTIONS 已含 error-handling；code-review-spec 審查清單與「變更時應同步更新」對照表與現有 docs/specs 對應正確。

---

## 5. 待改進與建議

| 項目 | 優先 | 說明 |
|------|------|------|
| **單元／整合測試** | 已補 | 已新增 `app/shared/contracts/items.contract.test.ts`（契約 parse）、`app/test/api.items.integration.test.ts`（GET /api/items 透過 MSW mock）；全部使用 mock。 |
| **dishes/ingredients/recipes/vendors API** | 低 | 若產品需要真實 API：補 `api.dishes` 等 route 與對應 handler，並更新 handler-mapping；若僅 mock：在 handler-mapping 或 docs 註明「僅前端 mock，無 route」。 |
| **ESLint 設定** | 低 | Remix 提示 `@remix-run/eslint-config` 將在 v7 棄用；可規劃改用官方建議之 ESLint 設定。 |
| **docs/CAPABILITIES.md 區隔** | 低 | 可於檔頭加一句區隔「專案能力現況」與根目錄「AGENT_CAPABILITIES」避免混淆。 |

---

## 6. 小結

專案在**分層、命名、路徑單一來源、型別與契約、文件與 Code Review 規範**上與現況一致；本次已修正 infra README 與 CONVENTIONS 連結。後續可優先補測試、再視需求補齊領域 API 或註明 mock-only，並依 [code-review-spec](code-review-spec.md) 在每階段工作後覆核。
