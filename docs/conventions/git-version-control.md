# Git 與版本控制

**類型**：spec | **權重**：1

本文件說明 Commit 慣例、刪除檔案時保留操作紀錄的方式，以及空資料夾處理。

---

## Commit 慣例

採用 **Conventional Commits**（commitlint 強制）：

- `feat:` 新功能
- `fix:` 修正 bug
- `chore:` 工具或維護
- `docs:` 文件更新
- `refactor:` 重構
- `test:` 測試

詳見 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

---

## 刪除檔案：使用 git rm

要保留 Git 操作紀錄時，請用 **`git rm <path>`** 刪除已追蹤的檔案，不要只從檔案系統刪除。

- 好處：staging 與 commit 會明確記錄「刪除」，方便協作與 AI 輔助時有一致紀錄。
- 適用情境：重構搬檔、清理舊元件、移除廢棄 API 等。

範例：

```bash
git rm app/components/old/Component.tsx
# 若有多檔可一次指定
git rm app/components/chat/ChatInterface.tsx app/components/lui/ChatBubble.tsx
```

---

## 空資料夾

Git **不追蹤空目錄**。刪除目錄內最後一個檔案後，該路徑會從 repo 樹狀結構消失。

- 本機若留下空資料夾，可手動用 `rmdir`（Windows）或 `rm -rf <dir>`（Unix）清除。
- 無需對空資料夾執行 `git rm`（Git 沒有空目錄的 tracked 物件）。

---

## 相關

- [CONTRIBUTING.md](../../CONTRIBUTING.md)：Commit message、Quality checks
- [AGENTS.md](../../AGENTS.md)：Coding agent 入口，含 Git 注意事項摘要
