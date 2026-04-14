# 專案定位與功能一覽

**類型**：reference | **權重**：1

本文件描述 AI Search Portal 的現況規格（as-is）：專案定位、資訊系統骨架、功能一覽。

---

## 專案定位

- **階段**：現階段為 **v1** — 聚焦**規劃架構與 mock 模擬真實後端互動**；尚未接真實後端，所有對外資料流以契約 + MSW mock 為主。領域 API（dishes / ingredients / recipes / vendors）於 v1 為 mock／待補。
- **產品名稱**：AI Search Portal（AI 搜尋入口）
- **角色**：匯聚與整理多個資訊系統的**骨架/入口**；新功能以模組化入口設計，不在此專案內實作完整後端，以 mock / 輕量整合為主。
- **使用者價值**：透過 LUI（Language User Interface）釐清意圖 → 給出結論與依據 → 提供可執行下一步；UI/UX 作為服務地圖，LUI 作為信任指引。

---

## 技術棧與架構要點

- **框架**：Remix v2 (Vite) + React 18 + TypeScript
- **UI**：Tailwind CSS、Radix（Shadcn 風格元件）、Lucide
- **資料層**：目前以 **in-memory mock** 與 **檔案型資料**（如 `content/release-notes.json`）為主，無需連線外部 API 即可運行
- **跨模組**：`app/shared/services/domain.server.ts` 為唯一跨 feature 查詢層（Dish / Ingredient / Recipe / Vendor）

---

## 功能一覽（現況）

| 功能                 | 說明                                                    | 入口 / API                                                                             |
| -------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **首頁**             | 標語、LUI Chat、信任說明、版號與語系切換                | `app/routes/_index.tsx`                                                                |
| **LUI Chat**         | SSE 串流回答；結論、依據、來源、下一步                  | `app/routes/api.chat.ts`，`app/services/lui.server.ts`                                 |
| **Items 管理頁**     | Items 列表、新增、單筆編輯/刪除                         | `/items`、`/items/new`、`/items/:itemId`                                               |
| **Items API**        | 通用 CRUD 範例（name, description）；用於示範與整合測試 | `api/items`（GET/POST）、`api/items/:itemId`（GET/PUT/PATCH/DELETE）                   |
| **領域頁面（v1）**   | Dish / Recipe 列表與詳情頁（以 in-memory mock 呈現）    | `/dishes`、`/dishes/:dishId`、`/recipes`、`/recipes/:recipeId`                         |
| **領域：食物與食譜** | Ingredient → Dish → Recipe / Vendor；營養與功效計算     | `app/features/{ingredient,dish,recipe,vendor}`，`app/shared/services/domain.server.ts` |
| **Release Notes**    | 版號與更新說明，來自 `content/release-notes.json`       | `/release-notes`，`api/release-notes`                                                  |
| **i18n**             | 語系切換（zh-TW / en），cookie + Form POST              | `app/shared/i18n`，`api/locale`                                                        |
| **SEO / Sitemap**    | meta、JSON-LD、sitemap.xml、robots.txt                  | `app/shared/seo.ts`，`routes/sitemap[.]xml.ts`、`robots[.]txt.ts`                      |

---

## 相關 product 文件

- 領域模型與關聯：[domain-food-recipe](domain-food-recipe.md)
- LUI 流程與 API：[lui-search](lui-search.md)
- 通用 CRUD 與 Mock Item：[items-api](items-api.md)
- 版號與 release notes：[release-notes](release-notes.md)
- Mock 策略與最小維護：[mock-data](mock-data.md)
