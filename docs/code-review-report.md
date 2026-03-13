# Code Review 報告（Clean Code、註解、規格對齊）

**依據**：[code-review-spec.md](code-review-spec.md)  
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

### 2.1 重複的 Error 訊息萃取（建議抽共用）

**位置**：`app/root.tsx`、`app/routes/_index.tsx` 的 ErrorBoundary。

**現狀**：兩處皆有下列邏輯：

```ts
error.data && typeof (error.data as { message?: unknown }).message === "string"
  ? (error.data as { message: string }).message
  : null;
```

**建議**：在 `app/shared/` 新增 helper（如 `getRouteErrorMessage(error: unknown): string | null`），或共用型別 `RouteErrorData { message?: string }` + type guard，減少重複與型別斷言。  
**對齊**：符合 code-review-spec 2.3「避免裸 any／集中型別斷言」。

---

### 2.2 Meta 的型別斷言過多

**位置**：`_index.tsx`、`release-notes._index.tsx`、`release-notes.$version.tsx` 的 `meta: MetaFunction<typeof loader>`。

**現狀**：`data?.title as string`、`data?.structuredData as Record<string, unknown>[]` 等重複出現。

**建議**：

- 定義共用型別（如 `SeoMetaData`）描述 loader 回傳的 title / description / canonical / locale / structuredData，在 loader 回傳時使用，並讓 `MetaFunction<typeof loader>` 推斷 data。
- 或在各 route 的 loader 明確標註回傳型別，讓 `data` 在 meta 內不需 `as`。  
  **對齊**：2.3 型別與安全、減少 as 斷言。

---

### 2.3 handlers.ts 中 PUT / PATCH 重複邏輯

**位置**：`app/test/handlers.ts`。

**現狀**：`http.put(ITEMS_BY_ID_PATH, ...)` 與 `http.patch(ITEMS_BY_ID_PATH, ...)` 主體邏輯相同（找 item、parse body、組 updated、回傳）。

**建議**：抽出共用工用函式（如 `handleItemUpdate(params, request, item)`），PUT/PATCH 共用以符合 DRY；可加註解「PUT 與 PATCH 共用更新邏輯」。

---

### 2.4 DELETE 是否一律經 submitFormPayload

**位置**：`app/features/dish/dish.hooks.ts` 的 `useDeleteDish`（以及可能其他 feature 的 delete hook）。

**現狀**：`fetcher.submit({}, { method: "DELETE", action: apiDish(id) })` 未經 `submitFormPayload`。

**建議**：

- 若規範「所有 submit 皆經 submitFormPayload」：改為 `submitFormPayload(fetcher, {}, { method: "DELETE", action: apiDish(id) })`，與 useCreateDish / useUpdateDish 一致。
- 若允許「無 body 的 DELETE 可直接 submit」：在 [docs/conventions/data-test-driven.md](conventions/data-test-driven.md) 或 [code-review-spec](code-review-spec.md) 2.3 註明例外。  
  **對齊**：2.2 契約與 API、2.3 submit payload 慣例。

---

### 2.5 ChatInterface 的 SSE 事件解析

**位置**：`app/components/shared/chat/ChatInterface.tsx` 的 `parseMetaEvent` / `parseFinalEvent`。

**現狀**：`JSON.parse` 後 `as Record<string, unknown>` 再手動檢查欄位，屬合理 unknown 收斂。

**建議**：若 LUI SSE 事件尚未有正式 Zod 契約，在函式上方加一行註解說明「SSE meta/final 事件格式目前無契約，採手動驗證」；日後若有契約可改為 schema.parse。  
**對齊**：註解與可讀性、與 data-test-driven 一致。

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

### 4.1 已對齊

- **docs/README.md**：一覽與 architecture / conventions / runbooks / product 對應正確。
- **docs/ARCHITECTURE.md、CONVENTIONS.md、DEVELOPMENT.md**：stub 連結至正確子文件。
- **specs/api/handler-mapping.md**：與 paths.ts、handlers 一致；dishes/ingredients/recipes/vendors 已標「待補」。
- **無殘留**：未發現指向已刪除 `.cursor/wiki` 或舊路徑的連結。

### 4.2 建議更新

| 項目                                | 建議                                                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **docs/CAPABILITIES.md**            | 依 [audit-report](audit-report.md) 建議，檔頭加一句：「本檔為專案能力現況（版號、多語系、無障礙）；agent 能力邊界見根目錄 AGENT_CAPABILITIES.md。」 |
| **code-review-spec 2.3**            | 可補充：「Meta 與 loader data 建議使用明確回傳型別或共用型別，減少在 meta 內對 data 的 as 斷言。」                                                  |
| **code-review-spec 或 conventions** | 新增小節「註解與可讀性」：公開 API、shared helper、契約、複雜分支建議簡短註解；SSE/非契約資料來源建議註明。                                         |

### 4.3 與 audit-report 一致

- 本次結論與 [audit-report.md](audit-report.md) 一致：dishes/ingredients/recipes/vendors 待補或註明 mock-only；CAPABILITIES 區隔；ESLint Remix 棄用屬低優先。

---

## 5. 變更時應同步更新的對照（提醒）

與 code-review-spec §3 一致，下列變更時請同步更新：

| 變更類型                                   | 應更新                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| 抽出 route error message helper            | `app/shared/` 新增、root + \_index ErrorBoundary 改用；可選更新 error-handling.md |
| 定義 SeoMetaData / 共用 meta 型別          | 使用到的 route loader + meta；必要時 docs 註明慣例                                |
| handlers PUT/PATCH 重構                    | `app/test/handlers.ts`、可選 handler-mapping 註解                                 |
| DELETE 改經 submitFormPayload 或文件化例外 | data-test-driven 或 code-review-spec 2.3                                          |

---

## 6. 小結

- **分層、契約、路徑、命名、文件入口**：與現況一致，無規格偏離。
- **Clean Code**：建議處理錯誤訊息重複、meta 型別、handlers DRY、DELETE 慣例、ChatInterface 註解。
- **註解**：上述數處加上簡短註解即可提升可讀性與後續維護。
- **規格文件**：僅需小幅補充（CAPABILITIES 區隔、code-review-spec 2.3 與註解小節），其餘已對齊。

若需逐項實作，可依「2. Clean Code 待辦」與「3. 註解建議」排優先順序，並在每階段後依 code-review-spec 再跑一次審查。
