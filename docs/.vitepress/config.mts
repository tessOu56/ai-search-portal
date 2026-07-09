import { defineConfig } from "vitepress";

// 對外策展文件站（決策 2026-07-09，見 platform-command planning/current-sprint.md）
// 鐵則：只發布本公開 repo 的文件；platform-command / develop-md 內部規劃永不進站。
export default defineConfig({
  title: "AI Search Portal",
  description:
    "Agent 可執行、人可接管、來源可驗證、權限可治理的資料與 API portal",
  lang: "zh-TW",
  base: "/ai-search-portal/", // GitHub Pages project site；改自訂網域時調整
  srcExclude: ["platform-inbox/**", "code-review-report.md", "audit-report.md"],
  ignoreDeadLinks: true, // 站外/倉內相對連結多，先不擋 build；逐輪整潔循環收斂
  themeConfig: {
    nav: [
      { text: "定位", link: "/product/agentic-integration-review" },
      { text: "Demo", link: "/RESUME-DEMO" },
      { text: "架構", link: "/ARCHITECTURE" },
    ],
    sidebar: [
      {
        text: "定位與敘事",
        items: [
          { text: "Agentic 整合檢閱與路線圖", link: "/product/agentic-integration-review" },
          { text: "3 分鐘 Demo", link: "/RESUME-DEMO" },
        ],
      },
      {
        text: "產品",
        items: [
          { text: "AI 體驗 × 雙路徑（SSOT）", link: "/product/ai-experience-plan" },
          { text: "介面路線圖 R1–R4", link: "/product/interface-roadmap" },
        ],
      },
      {
        text: "架構",
        items: [
          { text: "總覽", link: "/ARCHITECTURE" },
          { text: "產品架構（AI product）", link: "/architecture/ai-product/product-architecture-plan-2026-05" },
          { text: "Tool 邊界", link: "/architecture/ai-product/tool-boundary" },
          { text: "穩定 chat 契約", link: "/architecture/ai-product/stable-chat-contract" },
        ],
      },
      {
        text: "工程",
        items: [
          { text: "PROJECT-PLAN（Phase 0–5）", link: "/PROJECT-PLAN" },
          { text: "EXECUTION-PLAN 2026H2", link: "/EXECUTION-PLAN-2026H2" },
          { text: "Agent 協作", link: "/agent-collaboration" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/tessOu56/ai-search-portal" }],
    outline: { label: "本頁" },
    docFooter: { prev: "上一頁", next: "下一頁" },
  },
});
