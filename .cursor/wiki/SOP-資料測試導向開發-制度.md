# SOP-資料測試導向開發（制度版）

本文件為**大型協作**下的 Data-Driven Development 制度：可執行、可檢查、可擴張。

**資料治理脈絡**：前端要加速的是「協作效率」與「可治理的資料層」，不是資料格式本身。對等做法為 Contract-first、可執行的 mock（MSW 經 schema parse）、以及 Mock Dataset 版本化（可回溯、可重現）。見 **Ref-資料治理與前端對等**。

---

## 一、流程：Spec → Contract → Mock → Test → UI

| 步驟                     | 產出                                                         | 負責            |
| ------------------------ | ------------------------------------------------------------ | --------------- |
| **1. Feature Spec**      | 業務範圍、資料流、驗收條件（RA- 或 ticket）                  | 需求／Tech Lead |
| **2. Contract**          | Schema（Zod）+ API 路徑與方法；request/response 可驗證       | 開發者          |
| **3. Mock Layer**        | MSW handler，回傳經 schema parse 的資料                      | 開發者          |
| **4. Test**              | 單元／整合測試，依 handler 與 fixture 驅動                   | 開發者          |
| **5. UI Implementation** | 元件、hooks、routes；只透過 fetcher 或 shared api 打契約路徑 | 開發者          |

測試在 UI 實作前即可撰寫（依 Mock 與 Contract）。

---

## 二、強制規則（Enforcement）

### 2.1 Schema 必須可驗證

- 禁止僅依 TypeScript 型別定義契約。
- 使用 **Zod** 於 `app/shared/contracts/` 定義 request/response；handler 與（建議）route 回傳前須通過對應 schema parse。
- 見 **Ref-Contract-與-Schema-規範**。

### 2.2 Handler = Contract，不是假資料

- 每個對外開放的 API（含 Remix resource route）**必須**在 `app/test/handlers.ts`（或合併模組）有對應 MSW handler。
- Handler 產出的 response body **必須**經契約 schema parse，不得回傳未驗證物件。
- 見 **Ref-API-與-Handler-對照**。

### 2.3 API 呼叫必須走約定路徑

- **禁止**在 component 內直接 `fetch(url)` 硬編碼未在契約／對照表中的 URL。
- 允許：Remix `useFetcher` / loader 打契約內定義的 path；或透過 `app/shared/api` 的 typed client（若有）發送。
- 見 **app/shared/api/README.md**。

### 2.4 CI 檢查（建議）

- **lint:contracts**（可選）：檢查 `app/routes/api.*` 與 `app/test/handlers.ts` 的 path 對應，缺 handler 則失敗。
- **Test**：MSW 已 listen，未註冊 request 會 onUnhandledRequest: error；新增 API 未補 handler 時測試會失敗。
- 未來可加：handler response 的 schema parse 在 test 內斷言。

---

## 三、適用範圍（何時走完整流程）

| 情境                                                                 | 是否走完整流程                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------- |
| 新增／變更「對外 API」（resource route、或前端會 fetch 的 endpoint） | **必須**：Spec → Contract → Mock → Test → UI             |
| 僅改 UI 樣式、文案、不碰 API                                         | 不需補 Contract / Mock                                   |
| 僅改既有 server 內部邏輯、不變 response 形狀                         | 不需改 Contract；需確認 handler 與 route 仍通過原 schema |
| 內部工具、一次性 script                                              | 可從簡，不強制 MSW                                       |

---

## 四、Mock Dataset 版本化（可選，建議大型協作採用）

- Mock 情境以 **dataset version** 管理（`app/test/datasets/v1/`、`v2/`）；schema 或情境變更時新增版本，不直接覆寫舊版。
- 每版可含 `MIGRATION.md` 說明與前一版的差異；測試可指定 version 以重現結果。
- 見 **Ref-Mock-Dataset-版本化**、**Ref-資料治理與前端對等**。

---

## 五、契約漂移（Mock vs Production）

- **短期**：Zod 為單一來源；handler 與 route 皆用同一 schema parse，減少 mock 與實作不一致。
- **中期**：若導入 OpenAPI，可考慮由 OpenAPI 產 Zod 或由 Zod 產 JSON Schema，定期比對或做 contract test（如對 staging 打一輪契約檢查）。
- **文件**：**Ref-API-與-Handler-對照** 與 **Ref-Contract-與-Schema-規範** 需隨 API 變更同步更新。

---

## 六、Schema 設計能力與 Template

- 新進或對資料建模不熟者：依 **Ref-Contract-與-Schema-規範** 的 Template 新增契約檔。
- 不確定時：先小範圍 schema（單一實體、單一 response），再擴充；避免一次大改導致 UI 不穩。

---

## 七、相關文件

- **Ref-Contract-與-Schema-規範**：Zod 使用、契約檔位置、template。
- **Ref-API-與-Handler-對照**：API 清單與 handler 對應。
- **app/shared/api/README.md**：API 呼叫約定。
- **.cursor/rules/data-test-driven.mdc**：規則摘要。
