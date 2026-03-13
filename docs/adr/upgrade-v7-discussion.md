# 是否升級到 React Router v7（Remix 演進）— 討論摘要

**類型**：adr | **權重**：2

本文件整理「要不要升級到 v7」的考量，供團隊討論與決策。**非正式 ADR**，僅為討論用。

---

## 1. 「v7」指的是什麼？

- **現況**：專案使用 **Remix v2**（`@remix-run/*` ^2.17.2），底層是 React Router v6。
- **v7**：**React Router v7** = Remix 團隊將 Remix 併入 React Router 後的下一版；路由、data loading、actions 等概念延續，但套件與部分 API 會變。
- 因此「升級到 v7」= 從 **Remix v2 遷移到 React Router v7**（即「Remix 作為 React Router 的完整版」）。

---

## 2. 目前專案與 v7 的關係

- 已啟用部分 **v3 future flags**（`v3_fetcherPersist`、`v3_relativeSplatPath`、`v3_throwAbortReason`），有助之後貼近 v7 行為。
- 架構（五層、契約、paths、MSW）與框架版本無強綁定，遷移時多數可保留。
- 會受影響的：套件名與版號、route 慣例、loader/action 簽名、ESLint（`@remix-run/eslint-config` 在 v7 不再內建）、部分 Remix 專屬 API。

---

## 3. 升級的好處

| 面向 | 說明 |
|------|------|
| 長期維護 | 走在官方主線，避免停在 v2 後只剩社群修補。 |
| 新功能 | Single Fetch、lazy route discovery 等可選用，有助效能與體積。 |
| 警告與棄用 | 不再看到「eslint-config 棄用」「v3_xxx future」等提示（改為預設或移除）。 |
| 文件與生態 | 文件與範例會逐漸以 React Router v7 為主。 |

---

## 4. 暫不升級或延後的理由

| 面向 | 說明 |
|------|------|
| 穩定性與時程 | v7 正式版推出時程與成熟度需確認；若專案以穩定交付為先，可等 v7 穩定一陣再評估。 |
| 遷移成本 | 需換套件、改 import、可能動到 route 結構與 loader/action；測試與 CI 要重跑一輪。 |
| 效益是否急迫 | 若目前無效能或功能痛點，延後升級可把時間用在產品功能或架構優化。 |
| 依賴相容性 | `remix-utils`、其他 Remix 生態套件是否已支援 v7，需逐項查。 |

---

## 5. 若升級，預期會動到的部分

- **package.json**：`@remix-run/*` → `react-router` / `react-router-dom` 等 v7 套件；`remix vite:build` → 依 v7 官方腳本（如 `vite build` + 對應 plugin）。
- **路由與 entry**：route 慣例、root 與 entry 可能依 v7 模板調整（例如從 Remix 的 `app/root.tsx` 對應到 v7 的約定）。
- **Loader / Action**：簽名或 context 若有 breaking change，需依官方 migration 逐檔調整。
- **ESLint**：移除 `@remix-run/eslint-config`，改用 [docs/conventions/eslint-remix-deprecation.md](../conventions/eslint-remix-deprecation.md) 建議的精簡設定。
- **Vitest**：目前已在 test 時停用 Remix plugin；v7 若改為 Vite 為主的 build，可一併確認 test 設定是否仍適用。

---

## 6. 建議的討論問題（供會議或非同步決策）

1. **產品時程**：接下來半年是否有大 release 或上線壓力？若有，是否適合排入「框架升級」？
2. **v7 狀態**：目前 React Router v7 的 release 狀態與官方 migration guide 是否已足夠清晰？團隊是否有人先做過小規模 PoC？
3. **優先順序**：在「升級 v7」與「補功能／穩定性／效能（在 v2 上）」之間，哪一項優先？
4. **試行方式**：是否要開一個分支或小專案，用本專案的架構（paths、contracts、MSW）試遷移一兩個 route，再決定全面升級時程？

---

## 7. 小結

- **升級 v7**：適合當成「中長期技術債清理 + 跟上主線」，在 v7 穩定、且團隊有餘裕時排期。
- **暫不升級**：若目前以交付與穩定為主，留在 Remix v2 並持續用 future flags 與現有架構，是合理選擇；可之後再依 v7 成熟度與官方 migration 重新評估。
- 不論是否升級，**契約、paths、MSW、docs 架構**都可維持，遷移時主要對齊新套件與 route/loader API 即可。

---

**後續**：若討論後有結論，可另寫一則正式 ADR（例如 `ADR-001-remix-v2-vs-v7.md`）記錄決策與理由。
