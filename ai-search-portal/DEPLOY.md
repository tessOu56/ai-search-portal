# 部署指南

## 快速部署到 Vercel

1. **準備 GitHub 倉庫**
   ```bash
   cd ai-search-portal
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tessOu56/ai-search-portal.git
   git push -u origin main
   ```

2. **在 Vercel 部署**
   - 前往 https://vercel.com
   - 使用 GitHub 帳號登入
   - 點擊 "Add New Project"
   - 選擇 `tessOu56/ai-search-portal` 倉庫
   - Vercel 會自動偵測 Remix 專案
   - 點擊 "Deploy" 完成部署

3. **完成！**
   - 部署完成後，Vercel 會提供一個網址
   - 每次推送到 main 分支都會自動重新部署

## 其他部署選項

### Railway
1. 前往 https://railway.app
2. 連接 GitHub 帳號
3. 選擇倉庫並部署
4. Railway 會自動偵測並部署

### Render
1. 前往 https://render.com
2. 創建新的 Web Service
3. 連接 GitHub 倉庫
4. 設定：
   - Build Command: `npm run build`
   - Start Command: `npm start`

## 環境變數

如果需要整合真實的 AI API，可以在部署平台設定環境變數：

- `OPENAI_API_KEY` - OpenAI API 金鑰
- `ANTHROPIC_API_KEY` - Anthropic API 金鑰
- 或其他 AI 服務的 API 金鑰

