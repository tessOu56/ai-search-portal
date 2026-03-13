# 資料治理與前端對等

**類型**：reference | **權重**：2

本文件說明：為何前端不追求「資料格式效率」（如 Delta/Parquet），而追求**可治理的資料層**；以及如何把「資料治理」精神落實在契約、mock 與版本化上。

---

## 一、Delta/Parquet 的啟發（不是直接拿來用）

Delta/Parquet 的核心價值是：把**檔案型資料湖**變成**可治理的表格層**——版本、交易紀錄、併發寫入、回溯與一致性。常用在 analytics / lakehouse / ETL，**不是**為前端即時串接效能而設計。

對前端而言，要加速的是**協作效率**，不是「資料是不是 Parquet」；瓶頸通常是：

- API contract 不穩（schema 常變、欄位語意不清）
- mock 與真實環境漂移
- 重複打 API、快取策略混亂
- UI state 與 server state 混在一起、難測

**啟發點**：把「資料治理」變成**制度**（log、版本、schema enforcement），並在前端用對等的做法落地。

---

## 二、前端可落地的對等物：Contract-first + 可執行的 mock

| 做法                    | 本專案對應                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| 單一資料契約來源        | Zod schema（`app/shared/contracts/`）；未來可接 OpenAPI / GraphQL schema / JSON Schema                |
| 由契約生成型別與 client | 目前型別由 `z.infer`；未來可 codegen client                                                           |
| MSW handler 由契約驅動  | Handler 回傳前必須通過 schema parse（見 `app/test/handlers.ts`）                                      |
| CI 強制                 | 所有 API 須走約定路徑；每個 API 須有 handler；handler response 須通過 schema parse（`lint:handlers`） |

效果：減少「用猜的、等後端、口頭同步」，直接提升**串接與協作效率**。

---

## 三、兩種「高效」：效能 vs 開發速度

### A. 效能（runtime）

- **Server state 為主**：可引入 TanStack Query / SWR（dedupe、cache、stale-while-revalidate、retry、pagination）。
- **快取 key 與 invalidation** 比「少打 API」更重要。
- **BFF 或 edge aggregation**：多個後端呼叫聚合成前端友善的 API，減少 chatty network。

### B. 開發速度（協作生產力）

- **Contract-first + codegen**：減少手寫與錯誤（本專案先做 Zod + 手寫型別，未來可接 OpenAPI codegen）。
- **MSW 即規格**：所有人有相同、可重現的 mock 資料。
- **測試導向的資料層**：handler test / contract test 先於 UI。

建議順序：**先建 contract + service layer + CI**（已做），再視需求導入 query caching 或 BFF。

---

## 四、Mock Dataset 版本化（Delta 版本精神的對等）

與 Delta time travel 對齊：**可回溯、可重現、可控變更**。

- **Mock scenario 以 dataset version 管理**：例如 `app/test/datasets/v1/`、`app/test/datasets/v2/`。
- **Schema 變更**：不直接改掉舊 dataset，而是**新增版本**並在該版目錄提供 `MIGRATION.md` 或 changelog。
- **測試可指定 dataset version**：環境變數或 test 設定指定用 v1 或 v2，結果可重現。
- 見 [mock-dataset-versioning](../conventions/mock-dataset-versioning.md) 與 [mock-data](../product/mock-data.md)。

---

## 五、現況與落地清單

| 項目         | 現況                                      | 建議下一步                                                 |
| ------------ | ----------------------------------------- | ---------------------------------------------------------- |
| 資料來源     | REST（Remix resource routes）             | 維持；若後端有 OpenAPI 可考慮 codegen                      |
| OpenAPI      | 無                                        | 可選：由 Zod 產 JSON Schema 或由 OpenAPI 產 Zod            |
| 前端資料取得 | Remix `useFetcher` / loader               | 契約 + handler + CI 已就緒；可選加 TanStack Query 做 cache |
| Contract     | Zod（`app/shared/contracts/`）            | 維持單一來源；handler/route 皆 parse                       |
| Mock         | MSW handler，response 經 schema            | 補 Mock Dataset 版本化（datasets/v1, v2）                  |
| CI           | lint:handlers、schema 於 handler 內 parse | 可選：contract test 對 staging、dataset version 檢查       |

**優先優化目標**：本專案已選 **(1) 多人協作下的串接速度與穩定性**（contract + MSW + CI）。若之後要同時優化 **(2) 頁面效能與網路效率**，順序為：先鞏固 contract + service layer，再導入 TanStack Query / BFF。

---

## 六、相關文件

- [data-test-driven](../conventions/data-test-driven.md)：Spec → Contract → Mock → Test → UI、強制規則
- [contract-schema](../../specs/api/contract-schema.md)：Zod 契約與 template
- [handler-mapping](../../specs/api/handler-mapping.md)：API 與 handler 對應
- [mock-dataset-versioning](../conventions/mock-dataset-versioning.md)：dataset 目錄、版本、migration
- [mock-data](../product/mock-data.md)：種子、MSW、最小維護原則
