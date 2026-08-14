## Contributing Guide

感謝你願意一起協作。請依照以下流程提交變更。

## Prerequisites

- Node.js >= 20
- pnpm 9（建議透過 Corepack：`corepack enable`，會依 `package.json` 的 `packageManager` 對齊版本）

## Local Setup

```bash
pnpm install
pnpm run dev
```

**編輯器**：建議安裝專案推薦的 VS Code / Cursor 擴充（開啟專案時會提示，或見 `docs/VSCODE.md`）。

## Quality Checks

```bash
pnpm run build            # 建置
pnpm run test             # 單元／整合測試
pnpm run lint:ci          # 含 lint:filenames、lint:handlers、ESLint、typecheck
pnpm run format:check
pnpm run knip
```

## Commit Message

採用 Conventional Commits（已強制）。刪除檔案時請用 `git rm <path>` 以保留操作紀錄，詳見 [docs/conventions/git-version-control.md](docs/conventions/git-version-control.md)。整體 agent 流程見根目錄 [AGENTS.md](AGENTS.md)。

- `feat:` 新功能
- `fix:` 修正 bug
- `chore:` 工具或維護
- `docs:` 文件更新
- `refactor:` 重構
- `test:` 測試

## Accessibility (a11y)

- 表單輸入需有對應的 `<label>` 或 `aria-label`
- 僅圖示的按鈕／連結需加 `aria-label` 說明用途
- 有意義的裝飾用元素可加 `aria-hidden="true"` 避免朗讀干擾
- 新內容或非同步狀態可視情況使用 `aria-live`、`aria-busy`

## Pull Request

- 描述變更動機與影響
- 提供測試方式或說明無測試原因
- 若有 UI 變更請附截圖
- 本 repo 為 **public**：遵循 [SECURITY.md](SECURITY.md) 與 [docs/PUBLIC-NARRATIVE.md](docs/PUBLIC-NARRATIVE.md)（勿提交 secrets／業務外流敘述／`docs/platform-inbox`）
