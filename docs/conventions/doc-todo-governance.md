# 文件與 TODO 治理

**類型**：spec | **權重**：1

本文件定義「文件同步」與「TODO 治理」的單一路徑，適用於開發者與 AI agent。

## 1) 核心原則

- **單一來源**：架構/流程以 `docs/` 為主，契約/schema 以 `specs/` 與 `packages/shared-contracts/` 為主。
- **變更即同步**：程式改動若影響規格、路徑、流程，需同 PR 更新對應文件。
- **TODO 可追溯**：跨階段治理待辦統一用 `CR-xxx`，並在 `code-review/issues.md` 登錄。

## 2) 文件同步責任

### 2.1 一般程式變更

- 命名/結構規則變動：更新 `docs/conventions/coding-conventions.md`
- 開發流程/檢查命令變動：更新 `docs/runbooks/local-dev.md`
- 架構邊界或分層變動：更新 `docs/architecture/*` 與 `docs/README.md` 索引

### 2.2 API/契約變更

- 更新 `packages/shared-contracts/*`
- 更新 `specs/openapi/openapi.yaml`（若屬 HTTP 契約）
- 更新 `specs/api/handler-mapping.md`、`app/test/handlers.ts`
- 必要時更新 `docs/product/*`（對外行為改變）

## 3) TODO 治理（CR 系列）

- 格式：`// TODO(CR-xxx): description`
- `CR-xxx` 需在 `code-review/issues.md` 有對應列
- 關閉流程：
  1. 程式修正完成
  2. 程式內 TODO 移除
  3. `issues.md` 狀態改為 `closed`

詳細規則見 `code-review/README.md` 與 `docs/code-review-spec.md`。

## 4) 例行檢查清單（PR 前）

- `pnpm run build`
- `pnpm run test`
- `pnpm run lint:ci`
- `pnpm run code-review:list`

## 5) 建議審查順序

1. 先看 `docs/README.md` 入口是否包含本次新增/調整文件
2. 再核對 `docs/code-review-spec.md` 清單
3. 最後用 `pnpm run code-review:list` 檢查 TODO 一致性
