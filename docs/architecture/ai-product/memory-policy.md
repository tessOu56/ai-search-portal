# Memory Policy（Phase 4）

**類型**：reference | **權重**：3

## 範圍

本階段以 **文件與 query 參數保留** 為主；持久化 storage **可替換**（in-memory → Redis／DB）。

## 預設策略（可調）

| 項目            | 建議                                                    |
| --------------- | ------------------------------------------------------- |
| Session 識別    | `sessionId` query 或 cookie（未實作 cookie 前用 query） |
| Window          | 最近 N 輪（N 預設 10，可設定）                          |
| Summary trigger | 超過 token 預算或對話輪數閾值（預留）                   |
| Retention       | 開發：重啟即失；生產：與產品合规／審計政策對齊後定案    |

## 與契約

- `sessionId` 已預留於 `chatQueryParamsSchema`（可選）。

## 禁止

- 在未定稿審計／刪除政策前，將 **PII 寫入**長期儲存（預設關閉）。
