# Wiki 檔名前綴規則

本目錄為專案領域知識與協作規範，檔名前綴表示文件性質。

## 前綴說明

| 前綴      | 含義                              | 說明                                                                         |
| --------- | --------------------------------- | ---------------------------------------------------------------------------- |
| **RA-**   | 需求分析（Requirements Analysis） | 現況規格：業務流程、領域模型、資料結構、API 行為，供開發與維護依據           |
| **Ref-**  | 參考文件                          | 架構說明、總覽、指引，供查閱用                                               |
| **SOP-**  | 開發規範或流程                    | 開發者需遵循的規範或實作準則（本專案目前以 `.cursor/rules` 與 `docs/` 為主） |
| **Auto-** | 專案已自動化                      | 已寫入設定或 CI 的項目，開發者不需更動                                       |

## SOP 文件一覽

- **SOP-資料測試導向開發**：三步驟（需求 → schema+handler → UI/模組）、所有 API 經 handler、MSW 約定
- **SOP-資料測試導向開發-制度**：大型協作制度版 — Spec→Contract→Mock→Test→UI、Schema 可驗證（Zod）、強制規則、適用範圍、漂移策略、CI

## Ref 文件一覽

- **Ref-API-與-Handler-對照**：API 路徑與 MSW handler 對照表，新增 API 時同步維護
- **Ref-Contract-與-Schema-規範**：Zod 契約位置、命名、使用處、template、OpenAPI 關係
- **Ref-資料流與-Data-Driven-架構**：請求與契約資料流圖、角色對應
- **Ref-套件與-React-支援度**：React 18 基準、關鍵套件 peer/相容性、升級時維護方式
- **Ref-資料治理與前端對等**：Delta 啟發、Contract-first + 可執行 mock、雙軌優化（協作 vs 效能）、現況與落地清單
- **Ref-Mock-Dataset-版本化**：Mock dataset 目錄 v1/v2、MIGRATION、測試指定版本

## RA 文件一覽

- **RA-總覽**：專案定位、資訊系統骨架、功能一覽
- **RA-領域模型-食物與食譜**：Dish / Recipe / Ingredient / Vendor 與關聯
- **RA-LUI-搜尋入口**：首頁、Chat、SSE、LUI 回應結構
- **RA-Items-API**：通用 CRUD 範例與 Mock Item
- **RA-Release-Notes與版號**：版號與 release notes 現況
- **RA-Mock-Data-與最小維護**：Mock 策略、種子資料、最小維護開發
