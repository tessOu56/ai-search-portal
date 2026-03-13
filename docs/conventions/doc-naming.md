# 文件命名與權重

**類型**：reference | **權重**：2

本文件定義 **docs/** 與 **specs/** 內 Markdown 的類型與權重，讓開發者與 AI 一眼辨識「必讀／必遵 vs 參考／按需」。

---

## 類型（type）

| 類型 | 說明 | 典型位置 |
|------|------|----------|
| **entry** | 入口、總覽；先看這份再決定往哪查 | 根目錄 README、AGENTS、docs/README；docs 根目錄 UPPERCASE stub |
| **spec** | 規格／契約／必遵；審查與實作須符合 | code-review-spec、specs/api/*、conventions 內制度類 |
| **reference** | 參考；依需要查閱 | architecture/*、product/*、conventions 內說明類 |
| **runbook** | 操作程序；依情境執行 | runbooks/* |
| **adr** | 架構決策或討論摘要 | adr/* |
| **report** | 產出報告、盤查結果；非長期規格 | audit-report 等 |

---

## 權重（weight）

| 權重 | 說明 | 何時看 |
|------|------|--------|
| **1** | 必讀／必遵 | 入職、PR 前、審查時必須對齊 |
| **2** | 常用 | 開發與重構時經常參照 |
| **3** | 按需 | 遇到該主題時再查 |

---

## 檔名與目錄約定

- **根目錄**：`README.md`、`AGENTS.md`、`AGENT_CAPABILITIES.md`、`CONTRIBUTING.md` 等大寫或 Pascal，表示入口或高權重。
- **docs/ 根目錄**：`ARCHITECTURE.md`、`CONVENTIONS.md`、`DEVELOPMENT.md` 等 UPPERCASE 為入口 stub；其餘用 kebab-case（如 `code-review-spec.md`、`audit-report.md`）。
- **docs 子目錄**：一律 **kebab-case**（如 `system-overview.md`、`data-test-driven.md`）。
- **specs/**：kebab-case（如 `handler-mapping.md`、`contract-schema.md`）。

未來若以「檔名前綴」標示類型，可選：`spec-*`、`runbook-*`、`adr-*`、`report-*`；既有檔案可漸進更名並更新連結。

---

## 每份文件開頭標示

為讓一打開檔案就知權重，建議在標題下加一行：

- **類型**：entry | spec | reference | runbook | adr | report  
- **權重**：1 | 2 | 3  

例：`**類型**：spec | **權重**：1`

或於文件第一段首句寫明「本文件為**必遵規範**」／「本文件為**參考**」。

---

## 一覽表

完整一覽與各檔類型／權重見 [docs/README.md](../README.md)。
