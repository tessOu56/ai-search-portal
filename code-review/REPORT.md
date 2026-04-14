# Code Review 報告（Clean Code、註解、規格對齊）

**依據**：[code-review-spec.md](../docs/code-review-spec.md)  
**檢視範圍**：程式碼品質、註解、規格文件一致性  
**產出**：通過項 + 待辦清單（建議修正與文件更新）

---

## 1. 審查清單摘要（code-review-spec）

| 區塊             | 結果 | 備註                                                                                       |
| ---------------- | ---- | ------------------------------------------------------------------------------------------ |
| 2.1 分層與依賴   | ✅   | routes 薄層、API 路徑來自 paths.ts、無 component 內直接 fetch(url)                         |
| 2.2 契約與 API   | ✅   | 契約在 shared/contracts、paths.ts 單一來源、handler-mapping 與 handlers 對齊 Items API     |
| 2.3 型別與安全   | ✅   | 僅 submitPayload 內集中 `as any` 並註解；CR-001～CR-005 已關閉，meta 改為 getSeoFromLoader |
| 2.4 命名與慣例   | ✅   | 資料夾小寫、元件 PascalCase、lint:filenames 適用                                           |
| 2.5 文件與規格   | ✅   | docs 一覽正確、無殘留 .cursor/wiki 連結                                                    |
| 2.6 架構可套用性 | ✅   | README / AGENTS.md / tool adapter 對齊                                                     |

---

## 2. Clean Code 待辦（CR-001～CR-005 已關閉）

### §2.1 重複的 Error 訊息萃取 — **已關閉 (CR-001)**

**實作**：`app/shared/utils/errors.ts` 新增 `getRouteErrorDisplay(error)`，root 與 \_index ErrorBoundary 共用。

---

### §2.2 Meta 的型別斷言過多 — **已關閉 (CR-002)**

**實作**：`app/shared/seo.ts` 定義 `SeoLoaderData` 與 `getSeoFromLoader(data, defaults)`，三處 meta 改用，無 `as`。

---

### §2.3 handlers.ts 中 PUT / PATCH 重複邏輯 — **已關閉 (CR-003)**

**實作**：抽出 `handleItemUpdate(params, request)`，PUT/PATCH 共用。

---

### §2.4 DELETE 一律經 submitFormPayload — **已關閉 (CR-004)**

**實作**：dish、ingredient、recipe、vendor 的 delete hook 皆改為 `submitFormPayload(fetcher, {}, { method: "DELETE", action: ... })`。

---

### §2.5 ChatInterface 的 SSE 事件解析 — **已關閉 (CR-005)**

**實作**：`parseMetaEvent` / `parseFinalEvent` 上方加 JSDoc，說明格式目前無契約、採手動驗證。

---

## 3. 註解建議（已補齊）

| 位置                                                         | 狀態                                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| `app/routes/_index.tsx`                                      | 已加註「首頁步驟說明順序，與 i18n key 對應」。                   |
| `app/root.tsx`                                               | 已加註「package.json 讀取失敗時使用預設版號，不中斷啟動」。      |
| `app/components/app/errorboundary/ErrorBoundaryFallback.tsx` | 已加檔頭「用於 route 與 root ErrorBoundary 的 fallback UI」。    |
| `app/test/handlers.ts`                                       | 已於 `handleItemUpdate` 加註「PUT/PATCH 共用更新邏輯」。         |
| `release-notes.$version.tsx`                                 | 已於 `structuredData` 加註「JSON-LD 結構化資料，供 meta 使用」。 |

---

## 4. 規格文件整理建議

規格文件與審查對照見 [docs/code-review-spec.md](../docs/code-review-spec.md) §3。當期報告與議題以本目錄 `issues.md` 為準。
