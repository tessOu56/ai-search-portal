# UI Review Checklist v1（定版）

> 定版日：2026-07-08 · 出處：[visual-quality-plan.md](./visual-quality-plan.md) §2.A 直接採用八項的萃取定版
> 素材來源：[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) `design-taste-frontend` v2（已在地化改寫；上游更新追蹤見 visual-quality-plan §0）
> 適用：所有 UI PR。先標注 surface（marketing / product / data / developer），通用段全查，加驗段依 surface 查。

## 使用方式

1. PR 描述標注觸及頁面的 surface tag。
2. 逐項自查通用段；命中加驗段的 surface 再查對應段。
3. 任一項無法誠實勾選 → 未完成，不出貨（可標注豁免理由供 review 討論）。

---

## 通用（全 surface）

### 決策可追溯

- [ ] 無寫死色值／字級／間距——一律經 SDK token（`var(--x)` 或 Tailwind 語意 utility）
- [ ] 新視覺決策有出處（brief、PALETTE.md、或本次 PR 說明），不是「AI 給的預設」

### 一致性三 Lock

- [ ] Page Theme Lock：頁面單一主題，section 不反轉明暗
- [ ] Color Consistency Lock：accent 全頁一致，不中途換色
- [ ] Shape Consistency Lock：單一圓角系統（沿 `radius.base` 派生）

### 對比與可及性

- [ ] Button／CTA 對比 ≥ WCAG AA（4.5:1；大字 18px+ 為 3:1）
- [ ] Form：input、placeholder、focus ring、error text 全過 AA；label 在上、error 在下、不以 placeholder 代 label
- [ ] 照片底按鈕有 scrim／backdrop／描邊
- [ ] 焦點環可見；鍵盤可達

### 四態完整性

- [ ] Loading：形狀吻合的 skeleton（SDK ux `Skeleton`），不用泛用轉圈
- [ ] Empty：有引導行動（SDK ux `EmptyState`；AI 降級沿用並保留使用者輸入）
- [ ] Error：表單 inline、transient 才用 toast
- [ ] Tactile：`:active` 有回饋（`scale-[0.98]` 或 `-translate-y-[1px]`）

### 反 fake-UI

- [ ] 無 div 拼裝假截圖／假產品預覽
- [ ] 精確數字有真實來源，否則標注 mock（禁無來源的「92%」「4.1×」）
- [ ] 無假人名、蛋形 avatar、虛構 logo 牆；demo 資料一律可辨識為 mock

### 動效紀律

- [ ] 每個動畫能一句話說出目的（層級／敘事／回饋／狀態轉換）；「看起來酷」不算
- [ ] 尊重 `prefers-reduced-motion`
- [ ] 禁 `window.addEventListener('scroll')`；動效時長／easing 用 SDK motion tokens
- [ ] marquee 每頁 ≤ 1

### 中文排版與文案

- [ ] 全形標點一致；中文內容不混英文 em-dash（`—` 僅限中文破折號「——」語法）
- [ ] body 行長 ≤ 42 全形字（英文 ≤ 65ch）
- [ ] 文案自審完成：刪 AI 腔 filler——「賦能」「極致」「無縫」「重新定義」「一站式」「開箱即用」濫用、「Elevate／Seamless／Unleash」
- [ ] 一頁一種語氣；引用 ≤ 3 行且署名含姓名＋職稱

### 工程收尾

- [ ] 多欄版面逐段明示 `< 768px` 摺疊行為
- [ ] `min-h-[100dvh]`，不用 `h-screen`
- [ ] light／dark 兩模式皆目視檢查
- [ ] 版面家族每頁不重複（同構 section 出現第 2 次即重排）

---

## marketing / developer surface 加驗

- [ ] 首屏：標題 ≤ 2 行、說明 ≤ 40 全形字（英文 ≤ 20 words）、CTA 免捲動可見
- [ ] hero 頂部 padding ≤ 6rem；hero 內文字元素 ≤ 4（eyebrow 擇一、標題、說明、CTA 組）
- [ ] uppercase 小標（eyebrow）每 3 個 section ≤ 1
- [ ] 左右交錯（zigzag）≤ 連續 2 段
- [ ] CTA 語意不重複：同意圖同標籤（「聯絡我們」不再變體）
- [ ] logo 牆位於 hero 下方、只放 logo、用真實 SVG 或標注 mock
- [ ] 長清單（> 5 項）換元件呈現：分群／tabs／卡片格，不加長清單

## data surface 加驗（insights / dashboard / API explorer）

- [ ] 數字一律 `font-mono`
- [ ] 分隔用 1px 線或留白，不堆疊卡片框
- [ ] 長資料換虛擬列表／分頁，不無限加長
- [ ] 密度提高時仍保留 focus 與 hover 狀態可辨

---

## 改版（redesign）流程約束

動排版前先 audit 並記錄：使用中 token／寫死值清單、layout family 重複處、四態缺漏、要保留與淘汰的 pattern。改善順序固定：**字體 → 間距節奏 → 色彩校準 → 動效 → 關鍵結構重組**，滿足即停，不越級動結構。

---

_變更本檔需同步 [visual-quality-plan.md](./visual-quality-plan.md) §8 決策記錄。D2（data surface 用 `p-section-dense`／`gap-stack-dense` token）與 D3（Design Read 工作流，見 AGENTS.md「UI 產出規則」）已於 2026-07-08 定案生效。_
