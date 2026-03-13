# Mock Dataset 版本化

**類型**：reference | **權重**：2

Mock 情境以 **dataset version** 管理，對應資料治理中的「可回溯、可重現、可控變更」（類 Delta time travel 精神）。

---

## 目錄約定

```
app/test/
  datasets/
    v1/                    # 第一版 mock 情境
      items.json          # 可選：fixture 從檔案讀
      README.md            # 說明此版對應的 schema / 功能
    v2/                    # schema 或情境變更後的新版
      items.json
      MIGRATION.md         # 從 v1 的變更說明、breaking 欄位
  handlers.ts              # 可依環境或參數選用 v1/v2 fixture
  fixtures/                # 現有寫在程式內的 fixture 可逐步遷到 datasets/vN
```

- **v1, v2, …**：依功能或 schema 變更新增版本，不直接覆寫舊版。
- **MIGRATION.md**：該版相對於前一版的變更、breaking changes、欄位語意變更。

---

## 使用方式

1. **Handler**：可從 `datasets/v1/` 或 `datasets/v2/` 讀取 fixture（或由常數 `CURRENT_DATASET_VERSION` / 環境變數決定），再經契約 schema parse 後回傳。
2. **測試**：單元／整合測試可指定 `process.env.MSW_DATASET_VERSION=v1` 等，使結果可重現。
3. **新功能改 schema**：新增 `datasets/v2/`，在 v2 放新 fixture，並在 `MIGRATION.md` 註明與 v1 的差異；舊測試仍可選 v1。

---

## 與契約的關係

- 每個 dataset 版本內的 fixture 仍須通過**當前契約 schema** parse（或該版本對應的 schema，若專案支援多版 schema）。
- 若 schema 與 dataset 一起版本化，可在 `datasets/v2/` 註明「對應 contracts 的某某 tag 或日期」。

---

## 相關

- [data-governance](../architecture/data-governance.md)：為何要做 dataset 版本化、與 Delta 精神的對應
- [mock-data](../product/mock-data.md)：整體 mock 策略
- [data-test-driven](data-test-driven.md)：Handler 須經 schema parse
