# 套件升級與版本政策

**類型**：reference | **權重**：2

本文件說明何時更新依賴、日常更新與重大升級的差異，以及到哪裡找討論與決策。

## 日常依賴更新

- **安全／patch**：依團隊流程更新（如 Dependabot、定期 `npm update`）；更新後跑 `npm run lint:ci`、`npm run test`。
- **minor 升級**：在未改 API 的前提下可依需要升級；若為 React、Remix、Vite 等核心套件，請先查 [packages-react](packages-react.md) 與 peer 相容性。
- **流程**：見 [runbooks/local-dev](../runbooks/local-dev.md) 的依賴更新一節。

## 重大升級（框架或主線變更）

- **定義**：例如 Remix v2 → React Router v7、React 18 → 19、或會影響 route／loader／build 的升級。
- **作法**：先討論再排期，不單獨合併大版本升級。
- **討論與決策**：見 [adr/](../adr/)：
  - [upgrade-v7-discussion](../adr/upgrade-v7-discussion.md) — 是否升級到 React Router v7（Remix 演進）
- 結論可另寫成正式 ADR（如 `ADR-001-xxx.md`）記錄決策與理由。

## 小結

| 類型         | 作法                     | 參考 |
|--------------|--------------------------|------|
| 日常 patch/minor | 依流程更新、跑 CI/test | [local-dev](../runbooks/local-dev.md)、[packages-react](packages-react.md) |
| 重大升級     | 先討論、再排期、必要時寫 ADR | [adr/](../adr/)、[upgrade-v7-discussion](../adr/upgrade-v7-discussion.md) |
