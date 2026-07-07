## Summary

-

## Spec impact（若變更對外 API／契約請填）

- 相關檔案（例：`packages/shared-contracts`、`specs/openapi/openapi.yaml`、`docs/product/…`）：
- 契約變更：無 / 非破壞 / breaking（附遷移說明）
- Mock／handler-mapping 已同步：是 / 否 / 不適用
- Spec review 報告（開工前，見 [docs/spec-review.md](../docs/spec-review.md)）：`code-review/spec-reviews/…` / 不適用

## Test Plan

- [ ] `pnpm run lint:ci`（含 lint:filenames、lint:openapi、verify:openapi-codegen、lint、typecheck）
- [ ] `pnpm run test`
- [ ] 其他：

## Checklist

- [ ] 小步可回滾
- [ ] 有文件/註解更新（如需要）
- [ ] UI 變更已附截圖（如需要）
