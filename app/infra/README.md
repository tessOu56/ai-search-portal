# Infra Layer（可選）

本目錄對應 [docs/architecture/repo-layers.md](../../docs/architecture/repo-layers.md) 中的 **infra** 層：技術基礎設施（environment config、monitoring、logging、feature flags 等）。

## 是否採用

- **目前**：保留為可選層；若專案尚無共用 logger、analytics、feature-flags，可不在此新增檔案。
- **未來**：若需要集中管理環境變數、log、埋點或 feature flags，可在此新增子目錄，例如：
  - `config` — 環境設定（如 `env.ts`）
  - `logger` — 共用 logger
  - `analytics` — 埋點／監控
  - `feature-flags` — 功能開關

## 依賴規則

- **services**、**app shell** 可依賴 infra。
- infra 不依賴 features、components。

見 `docs/architecture/repo-layers.md`。
