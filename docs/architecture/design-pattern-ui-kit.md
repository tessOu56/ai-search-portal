# Design Pattern UI Kit 選型與技術評估

**類型**：reference | **權重**：2

本文件記錄 Figma 端 **design system / UI kit** 的選型評估：候選名單、評估維度、建議方向與導入前驗證。元件骨架以 [shadcn/ui](../DESIGN_SYSTEM.md) 為準、不替換；UI kit 僅作為設計層 pattern 與視覺參考，經 [figma-mcp](figma-mcp.md) 與 token 同步接入。

---

## 一、決策前提

- **shadcn/ui** 維持為 **component 層**：Radix + Tailwind、程式碼在 repo、可改。不替換。
- **目標**：找一個 **Figma 端的 design system / UI kit**，提供：
  - 設計 pattern（screen、layout、product 情境）
  - 視覺方向（外觀）
  - 可選：design token 結構，供「Figma → repo token」mapping 參考
- **Pipeline**：Figma Design System → Design Tokens → shadcn/ui components → AI coding（已具備 [Figma MCP](figma-mcp.md)、[token canonical 在 repo](../DESIGN_SYSTEM.md)）。
- **產品型態**（[overview](../product/overview.md)）：AI Search Portal、LUI Chat、輕量項目/領域功能、release notes；偏 **AI tool / agent interface**，非傳統大型 SaaS dashboard。

---

## 二、評估維度

| 維度                      | 說明                                                                        | 與本專案關係                                                                                          |
| ------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Token 結構**            | color / spacing / typography / radius / shadow 是否完整、可 export 或可對照 | 需能對應到 `app/tailwind.css` 與 semantic token；Figma → repo mapping 依 [figma-mcp §3](figma-mcp.md) |
| **Component state**       | default / hover / focus / disabled / loading 等                             | 與 shadcn 的 variant 對齊，減少 design→code 落差                                                      |
| **Product pattern**       | table / filter / settings / onboarding / dashboard 等                       | 覆蓋首頁、Chat、列表、設定等情境；若含 chat/copilot 更佳                                              |
| **Tailwind / code 對齊**  | 是否用 Tailwind 尺度或提供 code 對應                                        | 降低 design→code translation 成本，符合現有 stack                                                     |
| **Figma → code 可對應性** | Figma component 能否 mapping 到 shadcn 或明確規格                           | 影響 MCP / AI 產出與人工維護量                                                                        |

---

## 三、候選對照

| 候選                        | Token 結構                  | Component state | Product pattern           | Tailwind/code     | Figma→code               | 備註                 |
| --------------------------- | --------------------------- | --------------- | ------------------------- | ----------------- | ------------------------ | -------------------- |
| **Untitled UI**             | 完整（typography/color 等） | 狀態完整        | dashboard / auth / tables | 需自行對應        | 需建 mapping             | 平衡好，SaaS/AI 常用 |
| **Frames X**                | 有                          | 完整            | CRM / SaaS 覆蓋廣         | 需自行對應        | 需建 mapping             | 規模大，導入成本高   |
| **Flowbite Design System**  | 有                          | 中等            | dashboard                 | **Tailwind 原生** | **design→Tailwind 清楚** | 與 Tailwind 棧最貼合 |
| **UI Prep**                 | 較簡化                      | 需確認          | SaaS screens / onboarding | 需確認            | 需建 mapping             | screen pattern 多    |
| **Design System For Figma** | 需確認                      | 需確認          | product / dashboard / CRM | 需確認            | 需確認                   | 覆蓋高，一致性需驗證 |

---

## 四、建議方向（依目標取捨）

### 若優先「Figma + AI coding pipeline」與 Tailwind 棧

- **首選：Flowbite Design System**
  - 理由：design → Tailwind mapping 明確、token 與 spacing 易對齊 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) 與 `app/tailwind.css`，Figma 變數與 repo token 的 transformation layer 負擔較小。
  - 取捨：variant 深度與 pattern 廣度不如 Untitled UI / Frames X；對「AI portal + LUI」是否足夠需看實際 Figma 內容。

- **次選：Untitled UI**
  - 理由：token + component 品質好、SaaS/AI product 常見，pattern 完整。
  - 取捨：Tailwind 對應與 token 命名需自己建（符合現有「repo 為 token canonical」與 [figma-mcp](figma-mcp.md) 的 mapping 設計）。

### 若優先「enterprise / 大量 pattern」

- **Frames X** 適合 component 與 layout 需求極多的情境；對目前 AI Search Portal 規模可能過重，可列為後續擴充選項。

### 若優先「screen pattern / onboarding」

- **UI Prep** 可補足畫面級 pattern；需單獨確認 token 結構與 state 是否足夠做 design system governance。

---

## 五、導入前驗證（三件事）

鎖定單一 UI kit 前建議確認：

1. **Design token 是否可 export 或對照**
   - Figma Variables / 樣式是否具備 color / spacing / typography / radius（及必要時 shadow）。
   - 能否產出或整理成一份「Figma token 清單」，以便寫 `specs/figma-token-mapping.md` 或等同的 mapping 規格。

2. **Figma component 與 code component 的對應**
   - 關鍵畫面（例如首頁、Chat、Card、Button）在 Figma 的 component 是否具備穩定命名與 props/variants，能否在文件中定義「Figma component key / name → shadcn 元件 + variant」對照表，供 MCP / AI 與人工維護使用。

3. **UI kit 是否對齊 Tailwind spacing / scale**
   - 若 kit 使用 4/8px 或 8px grid 等常見尺度，與 Tailwind 預設較易對齊；若有自訂 spacing，需在 token transformation 中明確定義（避免 layout authority 混亂，見 [figma-mcp §4.3](figma-mcp.md)）。

**驗證結果**（選定 kit 後填寫）：

| 項目                  | 結果   | 備註                  |
| --------------------- | ------ | --------------------- |
| Token export / 對照   | 待驗證 | 選定 Figma 來源後填寫 |
| Component 對應        | 待驗證 | 選定 Figma 來源後填寫 |
| Tailwind spacing 對齊 | 待驗證 | 選定 Figma 來源後填寫 |

---

## 六、AI product UI pattern（獨立於 UI kit 選型）

「AI product UI patterns」（chat / workflow / agent / copilots）與傳統 SaaS dashboard 的 pattern 不同：

- **本專案已有**：LUI Chat、結論/依據/下一步、`app/components/shared/chat/ChatInterface.tsx` 等，屬 AI 介面 pattern。
- **建議**：
  - UI kit 選型先以 **token + 通用 product pattern + Tailwind 對齊** 為主。
  - **Chat / agent / copilot 專用 pattern** 可列為單獨的「AI product UI patterns」研究或第二層：例如在 Figma 自建一頁「LUI / Chat patterns」或參考現成 AI UI 範本，與主 UI kit 並存，不綁死在同一套 kit。
- **後續**：若需強化 LUI/Chat 視覺與 pattern，再單獨規劃「AI product UI patterns」來源與 Figma 結構（不影響主 UI kit 選型）。

---

## 七、建議產出與後續

1. **選型結果**（選定後更新本節）
   - 目前建議：優先評估 **Flowbite Design System**，次選 **Untitled UI**。選定後在此記錄最終採用 kit 與理由。

2. **Token / mapping**
   - 選定 Figma UI kit 後，依 [figma-mcp](figma-mcp.md) 完成：
     - design token schema（可放 `specs/design-token-schema.md` 或本目錄）；
     - figma → token mapping（可放 `specs/figma-token-mapping.md`）；
     - 可先從一小部分 token 試跑，再逐步擴充。

3. **AI pattern**
   - 與主 UI kit 分開規劃；可於 Figma 自建「LUI / Chat patterns」或參考 AI 介面範本，與主 kit 並存。

**不變原則**：shadcn/ui 仍是元件骨架，repo 仍是 token 與 layout 權威；所選 Figma UI kit 僅作為設計層的 pattern 與視覺參考，經由既有 Figma MCP 與 token transformation 接入，不取代現有架構。

---

## 八、小結

| 目標                                                       | 建議                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **外觀 + design pattern，且與 Tailwind / Figma→code 貼合** | 優先評估 **Flowbite Design System**，並做三項驗證。                                                     |
| **要更完整 token + SaaS pattern**                          | 併用或改選 **Untitled UI**，並接受自建 token mapping。                                                  |
| **Figma + AI coding pipeline**                             | 任一 kit 都需落實：token 可對照、component 可對應、spacing 可對齊；文件化於 design-system / figma-mcp。 |
| **AI 專用 pattern（chat / agent）**                        | 與主 UI kit 分開規劃，作為補充。                                                                        |

---

## 相關

- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)：Token canonical、Core components
- [design-system](design-system.md)：半自動化 UI、分層結構
- [figma-mcp](figma-mcp.md)：Figma MCP、Token transformation、導入順序
- [overview](../product/overview.md)：產品型態與功能一覽
