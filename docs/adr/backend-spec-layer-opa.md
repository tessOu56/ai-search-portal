# ADR：Backend Spec Layer — Data Contract + OPA

**狀態**：Accepted（POC）  
**日期**：2026-06-22

## 背景

資料治理需要可審計、可測試、可版本控管的規則層，而非硬編碼於 application code。

## 決策

採用輕量 **Backend Spec Layer** 堆疊：

```txt
OpenAPI     → HTTP 形狀
Data Contract → 欄位語意、PII、owner
OPA Rego    → allow / need_approval / mask_fields / require_audit
CI          → opa test + lint:openapi + lint:handlers
```

### API

- `POST /api/metadata/access-requests/evaluate` — 政策預覽（驅動 HITL UI）
- `POST /api/metadata/access-requests` — 提交申請；`need_approval && !approved` → 422

### HITL

前端**不**以 `tags.includes('PII')` 硬判；改呈現 OPA `reasons[]`，使用者點確認後送 `approved: true`。

### Runtime

| 模式           | 行為                                   |
| -------------- | -------------------------------------- |
| 預設           | `evaluateAccessInProcess` 鏡像 Rego    |
| `OPA_URL` 設定 | `backend` 呼叫 OPA REST API            |
| CI             | `pnpm run test:policies`（`opa test`） |

## 為何不用（現階段）

- **Pact**：MSW + Vitest 整合測試已足 POC
- **AsyncAPI**：無 event bus
- **Buf/Protobuf**：全 HTTP monorepo

## 後果

- 需維護 Rego 與 in-process evaluator 語意一致（測試覆蓋）
- Data Contract 與 catalog fixture 以 `datasetId` / fqn 對齊
