# lab-deck-studio — document-first 簡報編譯器

**契約 SSOT**：[`src/schema/deck-document.ts`](src/schema/deck-document.ts)（Zod）。投影片只是 view。
規劃與路線圖：`platform-command/planning/projects/deck-studio.md` · Ticket T-2026-021 · **長期產品方向已定調（2026-07-07）**，promote 獨立 repo 門檻見規劃檔 C 段。

## 用法

```bash
pnpm install
pnpm --filter @ai-search-portal/lab-deck-studio test        # B0 契約測試
pnpm --filter @ai-search-portal/lab-deck-studio build
pnpm --filter @ai-search-portal/lab-deck-studio deck:build  # fixture → dist/out/{brief,outline,script}.md
```

Resume-safe demo 輸入：[`src/fixtures/resume-interview.json`](src/fixtures/resume-interview.json)（固定 12 頁面試腳本；鏡像 repo 不出現在 slide，遵守 RESUME-DEMO 規則）。

## 階段狀態

- [x] **B0 契約**：DeckDocument Zod + fixture + vitest round-trip
- [x] B1（部分）：brief/outline/script markdown renderer + CLI
- [ ] B1：slides.pdf（Marp CLI）、slides.pptx（PptxGenJS）、theme 接線
- [ ] B2：planner（LLM optional、guardrails、失敗降級只出 brief）
- [ ] B3：README 作品集段 + 履歷句
