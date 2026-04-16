# Code Review 機制

當期 code review 報告與議題的單一入口：報告 → issues → code TODO → 掃描與一致性檢查 → CI 可見。

## Issue ID

- 格式：`CR-[0-9]{3,}`（CR 後至少 3 位數字，例如 CR-001、CR-012）。
- 與報告章節分離；章節僅在 `issues.md` 的 `report` 欄作參考。

## TODO 格式

僅允許 `// TODO(CR-xxx): description`（xxx 至少 3 位數）。禁止其他 CR 相關格式。

## issues.md

欄位：`id`、`report`（章節參考）、`file(s)`、`description`、`status`。

- **file(s)** 可為：單一檔案、多檔案逗號分隔、或 `multiple`（跨模組／無單一對應檔）。

若 issue 可定位到**具體程式位置**，應在對應程式加入 `TODO(CR-xxx)`。

## CR issue 關閉條件

1. 對應程式已修正
2. `TODO(CR-xxx)` 已自程式移除
3. `issues.md` 中該筆 status 改為 closed

## 指令

`pnpm run code-review:list` — 列出 CR TODO、missing、orphan；不阻擋 build。

## CI

僅產出報告，不擋 build。審查標準依 [docs/code-review-spec.md](../docs/code-review-spec.md)。未來可選：新增 orphan TODO 時 fail。

## 治理入口

- 文件與 TODO 治理總表：`docs/conventions/doc-todo-governance.md`
