# Code Review 報告（Clean Code、註解、規格對齊）

**依據**：[code-review-spec.md](../docs/code-review-spec.md)  
**檢視範圍**：程式碼品質、註解、規格文件一致性  
**產出**：通過項 + 待辦清單（建議修正與文件更新）

---

## 1. 審查清單摘要（code-review-spec）

| 區塊             | 結果 | 備註                                                                                   |
| ---------------- | ---- | -------------------------------------------------------------------------------------- |
| 2.1 分層與依賴   | ✅   | routes 薄層、API 路徑來自 paths.ts、無 component 內直接 fetch(url)                     |
| 2.2 契約與 API   | ✅   | 契約在 shared/contracts、paths.ts 單一來源、handler-mapping 與 handlers 對齊 Items API |
| 2.3 型別與安全   | ⚠️   | 僅 submitPayload 內集中 `as any` 並註解，符合；其餘見「待辦」                          |
| 2.4 命名與慣例   | ✅   | 資料夾小寫、元件 PascalCase、lint:filenames 適用                                       |
| 2.5 文件與規格   | ✅   | docs 一覽正確、無殘留 .cursor/wiki 連結                                                |
| 2.6 架構可套用性 | ✅   | README / AGENTS.md / tool adapter 對齊                                                 |

---

## 2. Clean Code 待辦

### §2.1 重複的 Error 訊息萃取（建議抽共用）

**Issue: CR-001**

**位置**：`app/root.tsx`、`app/routes/_index.tsx` 的 ErrorBoundary。

**建議**：在 `app/shared/` 新增 helper（如 `getRouteErrorMessage(error: unknown): string | null`），或共用型別 + type guard，減少重複與型別斷言。

---

### §2.2 Meta 的型別斷言過多

**Issue: CR-002**

**位置**：`_index.tsx`、`release-notes._index.tsx`、`release-notes.$version.tsx` 的 `meta: MetaFunction<typeof loader>`。

**建議**：定義共用型別（如 `SeoLoaderData`），在 loader 回傳時使用，讓 meta 內不需 `as`。

---

### §2.3 handlers.ts 中 PUT / PATCH 重複邏輯

**Issue: CR-003**

**位置**：`app/test/handlers.ts`。

**建議**：抽出共用函式（如 `handleItemUpdate`），PUT/PATCH 共用以符合 DRY。

---

### §2.4 DELETE 是否一律經 submitFormPayload

**Issue: CR-004**

**位置**：`app/features/dish/dish.hooks.ts` 及 ingredient、recipe、vendor 的 delete hook。

**建議**：改為 `submitFormPayload(fetcher, {}, { method: "DELETE", action: ... })`，或於 data-test-driven / code-review-spec 註明例外。

---

### §2.5 ChatInterface 的 SSE 事件解析

**Issue: CR-005**

**位置**：`app/components/shared/chat/ChatInterface.tsx` 的 `parseMetaEvent` / `parseFinalEvent`。

**建議**：函式上方加註解說明「SSE meta/final 事件格式目前無契約，採手動驗證」；日後若有契約可改為 schema.parse。

---

## 3. 註解建議

| 位置                                                         | 建議                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `app/routes/_index.tsx`                                      | 常數 `STEPS` 可加註「首頁步驟說明順序，與 i18n key 對應」。                           |
| `app/root.tsx`                                               | 讀取 version 的 `try/catch` 可註「package.json 讀取失敗時使用預設版號，不中斷啟動」。 |
| `app/components/app/errorboundary/ErrorBoundaryFallback.tsx` | 檔頭加一句：「用於 route 與 root ErrorBoundary 的 fallback UI」。                     |
| `app/test/handlers.ts`                                       | PUT/PATCH 區塊可註「與 PATCH 共用更新邏輯，可抽出共用函式」。                         |
| `release-notes.$version.tsx`                                 | loader 回傳的 `structuredData` 可註「JSON-LD 結構化資料，供 meta 使用」。             |

---

## 4. 規格文件整理建議

見 [docs/code-review-report.md](../docs/code-review-report.md) §4。當期報告與議題以本目錄 `issues.md` 為準。
