# 乾淨架構與業務規格中樞

**類型**：reference | **權重**：2

本專案朝向 **乾淨架構（Clean Architecture）**，並以 **業務規格（docs/product/*）為專案中樞**：所有功能與資料流皆可追溯到規格，依賴方向由外而內，業務邏輯不依賴框架與 UI。

---

## 業務規格做專案中樞

- **中樞**：`docs/product/` 內文件描述現況規格（業務流程、領域模型、API 行為、資料結構）。
- **原則**：新功能或 API 應先有對應的 product 文件或 ticket 描述；實作時 Contract、Mock、Test、UI 皆對齊該規格。
- **對照**：docs/architecture、docs/conventions 為架構與技術參考；docs/product 為「做什麼」的單一來源。

| 規格類型   | 位置           | 用途                                   |
| ---------- | -------------- | -------------------------------------- |
| 業務／領域 | docs/product/* | 專案中樞；功能一覽、領域模型、API 規格 |
| 架構／流程 | docs/architecture、docs/conventions | 怎麼實作、怎麼協作                     |

---

## 乾淨架構層級對應（本專案）

依賴方向：**外層依賴內層**，內層不認識外層。

| 層級（由內而外）       | 本專案對應                                                               | 說明                                                           |
| ---------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Entities / 領域**    | docs/product/*、`app/shared/types/_`、契約中的 entity schema             | 領域模型與共用型別；規格寫在 product，型別與 schema 為可執行表達 |
| **Use Cases / 應用**   | `app/features/*/*.server.ts`、`app/shared/contracts/*`、`app/services/*` | 業務流程與資料契約；輸入輸出由 Zod schema 定義                 |
| **Interface Adapters** | `app/test/handlers.ts`（MSW）、`app/shared/api`、`app/routes/api.*`      | 將外部請求轉成 use case 可用的格式；契約為介面                 |
| **Frameworks & UI**    | `app/routes/*`、`app/components/*`、`app/features/*/*.hooks.ts`          | 路由與 UI 只協調資料與畫面；不寫業務邏輯                       |

---

## 資料流與規格對齊（Spec → Contract → Mock → Test → UI）

- **Spec**：docs/product/* 或 ticket — 業務範圍、驗收、資料形狀。
- **Contract**：`app/shared/contracts/` — Zod schema，可 runtime 驗證。
- **Mock**：`app/test/handlers.ts` — MSW handler 回傳經 schema parse。
- **Test**：依 handler 與 fixture；可先於 UI。
- **UI**：僅透過 useFetcher / shared api 打契約路徑，不直接 fetch 硬編碼 URL。

此流程確保「業務規格為中樞」：從規格到契約到 mock 到 UI 一貫可追溯。

---

## 實務要點

1. **新增功能**：先寫或更新 docs/product/*（或 ticket），再走 Contract → Mock → Test → UI。
2. **跨模組**：共用邏輯放 `app/shared/*`，應用層整合放 `app/services/*`；領域知識以 docs/product 與 shared types 為準。
3. **Routes**：僅負責協調 loader/action 與 UI，不包含業務判斷；業務在 features/\*.server.ts 或 services。
4. **依賴**：features 與 components 可依賴 shared/contracts；contracts 與 shared/types 不依賴 routes 或 UI。

---

## 相關

- [overview](../product/overview.md)：功能一覽與專案定位
- [data-flow](data-flow.md)：契約與請求流
- [data-test-driven](../conventions/data-test-driven.md)：Spec→Contract→Mock→Test→UI 流程
