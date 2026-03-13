# Mock Data 與最小維護

**類型**：reference | **權重**：2

本文件描述 Mock 資料策略與最小維護開發原則：現況、種子資料、可選 MSW。

---

## 現況：資料來源一覽

| 範圍              | 儲存方式                          | 重啟後 | 說明                                                |
| ----------------- | --------------------------------- | ------ | --------------------------------------------------- |
| **Items API**     | in-memory 陣列                    | 清空   | `mock-items.server.ts` 內建 2 筆種子（alpha, beta） |
| **Dish**          | in-memory Map                     | 清空   | 無種子                                              |
| **Recipe**        | in-memory Map                     | 清空   | 無種子                                              |
| **Ingredient**    | in-memory Map                     | 清空   | 無種子                                              |
| **Vendor**        | in-memory Map + DishVendor Map    | 清空   | 無種子                                              |
| **Release Notes** | 檔案 `content/release-notes.json` | 保留   | 有則讀取，無則空陣列                                |
| **LUI 回答**      | 無狀態 mock 函式                  | -      | `lui.server.ts` 固定回傳範例                        |

---

## 最小維護開發原則

1. **不依賴外部 API**：開發與演示以 in-memory / 檔案為準，無需後端服務即可跑滿流程。
2. **種子資料集中管理**：領域種子（Ingredient / Dish / Recipe / Vendor）建議放在單一模組或 JSON，由各 feature server 啟動時載入（若為空才 seed），避免散落各處。
3. **Items API**：維持現狀即可，作為通用 CRUD 範例與測試用。
4. **Release Notes**：只改 `content/release-notes.json`，不改程式。
5. **LUI**：目前 mock 回傳固定內容；未來若要接真實檢索/LLM，僅替換 `lui.server.ts` 實作，API 契約不變。

---

## 種子資料（已實作）

- **模組**：`app/services/seed.server.ts` 的 `ensureSeeded()`。
- **觸發**：Root loader 每次請求時呼叫；函式內以 `seeded` 旗標僅執行一次（process 生命週期內）。
- **內容**：若 Ingredient Map 為空，則建立 2 筆原料（紅棗、枸杞）、1 筆 Dish（紅棗枸杞茶）、1 筆 Recipe、1 筆 Vendor（示範養生館）與一筆 DishVendor 關聯；營養與功效由既有 `nutrition.server` 計算。
- **不覆寫**：若已有 Ingredient 資料（例如測試注入），則直接 return，不寫入。

---

## MSW（Mock Service Worker）

- **現況**：`app/test/handlers.ts` 已註冊 Items API 等 handler，回傳經契約 schema parse。
- **最小維護**：單元測試可直接測 server 函式；E2E 或整合測試透過 MSW 隔離 API；新增 API 須同步新增 handler。

## Mock Dataset 版本化（資料治理變遷）

- **目的**：可回溯、可重現、可控變更；對應「資料治理」中的版本精神（見 [data-governance](../architecture/data-governance.md)）。
- **約定**：Mock 情境以 `app/test/datasets/v1/`、`v2/` 等版本管理；schema 或情境變更時新增版本並撰寫 `MIGRATION.md`，不直接覆寫舊 fixture；測試可指定 dataset version。
- **現況**：目前 fixture 仍寫在 handlers 內；目錄 `app/test/datasets/v1/` 已預留，可逐步將 fixture 遷出或由檔案載入。見 [mock-dataset-versioning](../conventions/mock-dataset-versioning.md)。

---

## 相關文件

- 領域模型：[domain-food-recipe](domain-food-recipe.md)
- Items API：[items-api](items-api.md)
- LUI：[lui-search](lui-search.md)
- 版號：[release-notes](release-notes.md)
- 資料治理與 dataset 版本：[data-governance](../architecture/data-governance.md)、[mock-dataset-versioning](../conventions/mock-dataset-versioning.md)
