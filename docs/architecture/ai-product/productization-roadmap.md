# Productization Roadmap（Phase 5）

**類型**：reference | **權重**：3

本文件描述 **Phase 5** 的目標能力；實作可分期導入，不影響 Phase 1～4 契約穩定性。

## 成本與路由

- Model routing 規則（cheap vs quality）、每使用者／每租戶 quota。
- Cache：相同 query + policy 下的快取策略（需審計時禁用或縮短 TTL）。

## 評測與實驗

- Offline eval dataset、線上 A/B（僅後端／Agent 旗標，前端契約不變）。

## 進階可靠性

- **DLQ**：內部事件／broker 消費失敗時進入 DLQ，人工或自動重試。
- **Retry**：可恢復錯誤的指數退避；與冪等鍵（`eventId`／請求 id）並行設計。
- **Idempotency**：對外寫入類 API 使用 idempotency-key；內部 consumer 去重。

## Dashboard

- 延遲、錯誤率、token 成本、tool 失敗率（資料源：Agent + Gateway 日誌／metrics backend）。
