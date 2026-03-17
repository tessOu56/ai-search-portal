# Figma MCP 架構與設計稿同步

**類型**：reference | **權重**：2

本文件說明 Figma 與本專案的整合方式：MCP 定位、唯讀 tool 範圍、Token 轉換層、導入順序、**Figma → AI 修改邊界**，以及最小可行 MCP 架構要點。設計稿與 token 同步流程見 [design-system](design-system.md) 未來可選項；**Token 的 canonical 在 repo**，見 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)。

**原則**：AI 可作為開發工具直接修改 repo，但所有變更仍以 **repo 的 design system 與 token schema 為準**，Figma 僅提供設計 context。誰擁有設計權威必須明確：repo 的 token schema、component API 與 layout system 為唯一權威，MCP 只提供 context。

---

## 一、Figma MCP 的本質

目前常被混稱的三者：

| 名稱             | 本質           |
| ---------------- | -------------- |
| Figma API        | 官方 REST API  |
| Figma Dev Mode   | 提供 code spec |
| Figma MCP server | 社群 bridge    |

**MCP server 本質上是 Figma API adapter**：將 Figma API 包成 MCP protocol，供 Cursor 等 AI 工具以 tools/resources 方式讀取設計資料。並非官方產品，多為社群或自建。

---

## 二、MCP Tool Scope：唯讀

MCP server **僅暴露讀取操作**，典型能力為：

- `get_file(file_key?)` — 回傳檔案 meta / 節點樹摘要
- `get_variables(file_key?)` — 回傳 variable 清單（名稱、類型、mode、值）
- `get_component_spec(node_id | component_key)` — 回傳單一元件 spec（props、尺寸、樣式摘要），供對照 DESIGN_SYSTEM.md / ui 元件

**不暴露** `update_figma` 或任何寫入 Figma 的 API，避免 AI 直接改設計稿造成治理混亂。

---

## 三、Token Transformation Layer

設計 token 同步是整個 workflow 最大技術風險。Figma Variables 與 CSS 變數格式不一致，需在 repo 內定義 **Token transformation layer**，涵蓋三點：

### 3.1 Naming strategy

- Figma 常見：`color.primary.500`、`spacing.small`、`font.body`
- 本專案 Tailwind/CSS：`--primary`、`--spacing-sm`、`--font-body` 等（見 `app/tailwind.css`）
- 需明確定義 **figma variable → repo CSS token** 對應表，可放在 `specs/figma-token-mapping.md` 或同目錄下規格檔，供 AI 與人工依規則更新 `app/tailwind.css`。

### 3.2 Semantic vs raw token

- 兩層 token：primitive（如 `blue-500`）→ semantic（如 `primary`）。
- Figma 與 repo 雙邊是否一致，需在 design token schema 與 mapping 中定義；見 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) 的 Brand / Semantic 說明。

### 3.3 Mode support

- Figma variables 支援 light / dark mode。
- 本專案 CSS 以 `:root` 與 `.dark` 區分（`app/tailwind.css`）；需在 mapping 或轉換規則中寫明 mode 對應方式（例如 Figma `mode: dark` → `.dark` 下的變數）。

---

## 四、Figma → AI 修改邊界（治理三風險）

會破壞 Design System 的往往不是「AI 生成 code」，而是 **AI 讀到設計稿後開始補齊差異**。若無明確約束，Agent 容易把設計稿當真實來源，在 repo 裡新增或調整結構。以下三點為最常見的破壞點與對應治理。

### 4.1 Token drift（設計 token 與程式 token 漂移）

- **風險**：MCP 提供 variables 時，AI 發現設計稿與 repo token 不一致（例如 Figma 有 `color.primary.550`，repo 只有 `--color-primary-500`），若無規則會傾向直接新增 token 以「符合設計」，導致 token 膨脹、semantic 與 primitive 混雜、Tailwind/CSS 變複雜。
- **Token policy**：
  - AI **只允許修改既有 token 的數值**，**不可新增 primitive token**。
  - 若設計稿出現 repo 未定義的 token，只能**標記為待人工確認**，不得自行新增。
- 對應文件：design token schema、figma → token mapping；見 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)、本文件 §3。

### 4.2 Component divergence（元件實作與設計規格分岔）

- **風險**：Figma component spec 與實際 UI component 很少完全一致；設計稿可能有多種 padding、icon 位置，repo 只實作一部分。AI 若讀到 spec 會嘗試補齊 missing variants 或生成新 component，導致 design system API 變複雜或出現兩套行為。
- **治理**：design-system **primitives**（如 Button、Input）**僅由人工維護**。AI 若發現 spec 與實作差異，**只能更新 token 或 component docs**，**不得新增 primitive variant 或新 primitive component**。
- 對應：`app/components/ui/*` 為 primitives；見 [design-system](design-system.md) 分層。

### 4.3 Layout authority 混亂

- **風險**：Figma frame 含 layout、spacing、responsive，repo 可能用 container system 或 utility class 實作。AI 若依 frame spec 直接生成 CSS 或 Tailwind class，易破壞既有 layout pattern（例如新增 ad-hoc margin、grid），長期使 layout system 失去一致性。
- **治理**：**Layout 層排除在 MCP 導入範圍外**。Figma MCP 只用於 **token 與 component style**，**不用於 page layout**。Agent 在 rules 或 prompt 中須明確限制：不依 Figma frame 生成或修改 layout 相關 class；layout 權威在 repo 的 container / 既有 pattern。

### 4.4 AI 參與開發時的權威與 CI

- **人類主導模式**（IDE 內 AI 建議、開發者確認）：變更皆經人工 review，Design System 較不易被破壞。
- **Autonomous agent**（AI 直接改多檔、開 PR）：須限制編輯範圍，例如僅允許修改 `app/tailwind.css`（token 值）、`docs/`、既有 component 實作內容，**不得新增** design-system primitive 或 primitive token。
- **CI 作為治理**：PR 若新增 design token 或 primitive component，CI 可標記為需人工審核；若修改 UI component，可跑 visual regression 或 snapshot test。所有變更仍須通過 repo 規則與 CI 檢查。

---

## 五、導入順序（Schema → Mapping → MCP）

實務建議依序進行，避免「先上 MCP、AI 不知如何對應」：

1. **Step 1**：定義 **design token schema**（repo 內，可放 `specs/design-token-schema.md` 或本目錄）。內容包含：primitive / semantic、命名格式、mode（light/dark）。
2. **Step 2**：定義 **figma → token mapping**（Figma variable 名稱/群組 對應到 repo 的 token 鍵與 CSS 變數）。可寫成表或 `specs/figma-token-mapping.md`。
3. **Step 3**：再引入或開發 **MCP server**，並在 Cursor 設定 `.cursor/mcp.json`（見下節）。

---

## 六、最小可行 Figma MCP 架構要點

可作為後續實作或規格對齊用。

### MCP server structure

- 單一 process：Figma API client + MCP protocol adapter。
- 環境變數：`FIGMA_ACCESS_TOKEN`、可選 `FIGMA_FILE_KEY`（或由 tool 參數傳入）。

### Tools spec（唯讀）

| Tool                                           | 說明                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `get_file(file_key?)`                          | 回傳檔案 meta / 節點樹摘要。                                                    |
| `get_variables(file_key?)`                     | 回傳 variable 清單（名稱、類型、mode、值）。                                    |
| `get_component_spec(node_id \| component_key)` | 回傳單一元件 spec（props、尺寸、樣式摘要），供對照 DESIGN_SYSTEM.md / ui 元件。 |

### Token transform 責任歸屬

- **MCP 不做「寫入 repo」**：MCP 只回傳 Figma 原始或輕度正規化資料。
- 轉換規則（figma variable → repo token）寫在 **repo 內**（例如 `specs/figma-token-mapping.md` 或小 script 規格），由 Cursor Agent 或人工依規則改 `app/tailwind.css` / token 設定。

### Cursor config

- 專案級設定：`.cursor/mcp.json`，指向上述 MCP server（`command` 或 `streamableHttp`）。
- README 或 runbook 註明：需設定 `FIGMA_ACCESS_TOKEN`；MCP 僅讀，不寫入 Figma。
- 使用方式見 [figma-to-deploy-workflow](../runbooks/figma-to-deploy-workflow.md)。

### 實作位置

- **MCP server**：`tools/figma-mcp/`（`server.mjs` + `package.json`）。執行方式：`npm run start --prefix tools/figma-mcp`，需 env `FIGMA_ACCESS_TOKEN`、可選 `FIGMA_FILE_KEY`。詳見 [tools/figma-mcp/README.md](../../tools/figma-mcp/README.md)。

---

## 七、相關

- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)：Token canonical 在 repo、Core components
- [design-system](design-system.md)：半自動化 UI、設計稿與 token 同步為未來可選
- [figma-to-deploy-workflow](../runbooks/figma-to-deploy-workflow.md)：AI-assisted Design-to-Code Pipeline
- [AGENT_CAPABILITIES.md](../../AGENT_CAPABILITIES.md)：AI 不主動新增 UI component、僅可改 token/docs 等邊界
