# Code Review 規範

**類型**：spec | **權重**：1

本文件為**每階段工作後**進行 code review 的檢查標準，目的在讓**規格與專案現況保持一致**。適用對象：**開發者**與 **AI（Coding Agent / Review Agent）**。審查時可依本規範逐項勾選，並在發現偏離時更新對應的 docs / specs。

---

## 1. 目的與使用時機

- **目的**：確保程式碼、契約、架構文件與實際目錄結構同步；避免規格過時或與實作脫節。
- **使用時機**：每階段工作完成後（例如 feature 完成、重構完成、上線前）、或 PR 前自檢／審查時。
- **產出**：通過檢查、或產出「待辦：更新 X 文件／修正 Y 違規」清單。當期報告與議題在 **code-review/REPORT.md**、**code-review/issues.md**；待辦應在對應程式位置加 `// TODO(CR-xxx): description`（ID 為 CR-001 等，見 [code-review/README.md](../code-review/README.md)），並在 issues.md 登錄。

---

## 2. 審查清單

### 2.1 分層與依賴方向

- [ ] **Canonical 分層**：`specs/` 為契約、`docs/` 為工程知識、`AGENTS.md` / `AGENT_CAPABILITIES.md` 為 agent 入口；`.cursor/rules` 等僅為 tool adapter，不另定義架構／產品 truth。
- [ ] **依賴方向**：符合 [docs/architecture/repo-layers.md](architecture/repo-layers.md)；features 不依賴其他 features；components 不依賴 features；禁止在 component 內直接 `fetch(url)`。
- [ ] **Route 薄層**：`app/routes/*` 僅負責 loader/action 與組裝 UI，業務邏輯在 `app/features/*` 或 `app/services/*`。

**若違反**：調整程式或補充/修正 [docs/architecture/repo-layers.md](architecture/repo-layers.md)、[docs/architecture/system-overview.md](architecture/system-overview.md)。

---

### 2.2 契約與 API

- [ ] **契約單一來源**：API 的 request/response 形狀以 `app/shared/contracts/`（Zod）為準；與 [specs/api/contract-schema.md](../specs/api/contract-schema.md) 一致。
- [ ] **API 路徑單一來源**：所有 API 路徑從 `app/shared/api/paths.ts` import，不在 component / hooks / routes 內硬編碼路徑字串。
- [ ] **Handler 對照**：對外 API 在 [specs/api/handler-mapping.md](../specs/api/handler-mapping.md) 有對照、且 `app/test/handlers.ts` 有對應 MSW handler；新增 API 時兩處皆需更新。
- [ ] **錯誤 response**：若 API 回傳錯誤，形狀與契約一致（如 `errorResponseSchema`）；見 [docs/conventions/error-handling.md](conventions/error-handling.md)。

**若違反**：補齊或修正 `app/shared/contracts/*`、`app/shared/api/paths.ts`、`specs/api/handler-mapping.md`、`app/test/handlers.ts`，以及 [docs/conventions/data-test-driven.md](conventions/data-test-driven.md) 若有提及流程。

---

### 2.3 型別與安全

- [ ] **避免裸 `any`**：除在 shared 層單一處（如 `submitFormPayload` 內對 Remix submit 的型別斷言）並加註 eslint-disable 外，不在 feature 或 component 內使用 `as any` / `any`。
- [ ] **Submit payload**：表單／CRUD 提交透過 `app/shared/api/submitPayload.ts` 的 `submitFormPayload`，不直接在各 hook 內對 `fetcher.submit` 做型別斷言。

**若違反**：改為使用 shared 型別或 helper，或將唯一必要斷言集中至 shared 並註明理由。

---

### 2.4 命名與慣例

- [ ] **資料夾**：`app/` 下（除 `app/routes`）資料夾為小寫、無連字號/底線（見 [docs/conventions/coding-conventions.md](conventions/coding-conventions.md)）。
- [ ] **元件檔**：`app/components/**/*.tsx` 檔名為 PascalCase。
- [ ] **檢查**：`npm run lint:filenames` 通過；`npm run lint`、`npm run typecheck` 通過。

**若違反**：重新命名或修正，並確認 [docs/conventions/coding-conventions.md](conventions/coding-conventions.md) 仍涵蓋當前規則。

---

### 2.5 文件與規格對齊

- [ ] **架構變更**：目錄結構或分層若有變更，已更新 [docs/architecture/](architecture/)、必要時 [AGENTS.md](../AGENTS.md) / [AGENT_CAPABILITIES.md](../AGENT_CAPABILITIES.md)。
- [ ] **產品／領域**：功能或領域模型變更時，已更新 [docs/product/](product/) 對應文件。
- [ ] **入口與索引**：根目錄 `docs/ARCHITECTURE.md`、`docs/CONVENTIONS.md`、`docs/DEVELOPMENT.md` 的連結仍正確；[docs/README.md](README.md) 一覽與實際 docs 結構一致。
- [ ] **無殘留**：無指向已刪除或搬移文件的連結（如舊 `.cursor/wiki`）；無過時路徑或檔名。

**若違反**：更新對應 docs、specs 或根目錄 stub；修正壞鏈。

---

### 2.6 架構可套用性（若本 repo 作為範本）

- [ ] **README**：若本專案作為技術架構範本，README 已註明「架構範本與可套用性」並連結至 `docs/README.md`、`AGENTS.md`、`AGENT_CAPABILITIES.md`。
- [ ] **Tool adapter**：`.cursor/rules` 等僅指向 canonical 來源並補充工具專用格式，不覆寫專案 truth。

**若違反**：更新 README 或 adapter 內容，使與 [AGENT_CAPABILITIES.md](../AGENT_CAPABILITIES.md) 的 Extension Policy 一致。

---

## 3. 變更時應同步更新的對照

| 變更類型       | 應更新的檔案／位置                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 新增／變更 API | `app/shared/contracts/*`、`app/shared/api/paths.ts`、`specs/api/handler-mapping.md`、`app/test/handlers.ts`；必要時 [docs/conventions/data-test-driven.md](conventions/data-test-driven.md) |
| 目錄或分層調整 | [docs/architecture/repo-layers.md](architecture/repo-layers.md)、[docs/architecture/system-overview.md](architecture/system-overview.md)、必要時 AGENTS.md / AGENT_CAPABILITIES.md          |
| 錯誤處理慣例   | [docs/conventions/error-handling.md](conventions/error-handling.md)、契約內 error schema、specs 註明                                                                                        |
| 命名／慣例調整 | [docs/conventions/coding-conventions.md](conventions/coding-conventions.md)、必要時 `lint:filenames` 規則                                                                                   |
| 產品／領域變更 | [docs/product/](product/) 對應文件、[docs/README.md](README.md) 一覽                                                                                                                        |

---

## 4. 給 AI（Coding / Review Agent）的注意事項

- **Canonical 優先**：審查結論以本規範與 `docs/`、`specs/`、`AGENTS.md`、`AGENT_CAPABILITIES.md` 為準；tool-specific 設定不覆寫上述來源。
- **產出**：審查後可產出「通過」或「待辦清單」（列出違規項與建議更新的文件／程式位置）。
- **修改權限**：Review Agent 僅建議修正，不直接改程式；Coding Agent 依授權可一併更新程式與對應文件以符合本規範。

---

## 5. 相關文件

- [code-review/README.md](../code-review/README.md) — Code review 機制、TODO 格式、一致性檢查
- [docs/README.md](README.md) — docs 目錄索引
- [AGENTS.md](../AGENTS.md) — Coding agent 入口與流程
- [AGENT_CAPABILITIES.md](../AGENT_CAPABILITIES.md) — 能力邊界與 agent class
- [docs/conventions/coding-conventions.md](conventions/coding-conventions.md) — 命名與慣例
- [docs/conventions/data-test-driven.md](conventions/data-test-driven.md) — Spec→Contract→Mock→Test→UI
- [docs/conventions/error-handling.md](conventions/error-handling.md) — 錯誤與邊界處理
