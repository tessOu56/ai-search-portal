# 視覺品質規劃 — taste-skill 參考評估與引入提案

> 建立日：2026-07-08 · 狀態：**§2.A 已採用定版**（→ [ui-review-checklist.md](./ui-review-checklist.md)）；§8 D2–D5 討論中
> 參考來源：[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)（`design-taste-frontend` v2 experimental，SKILL.md 1206 行全文已審閱）
> 定位原則：**taste-skill 是參考意見，不是開發標準**。產品規格 SSOT 仍是 `specs/` + [interface-roadmap.md](./interface-roadmap.md)；視覺 token SSOT 仍是 explore-design-sdk。本文件只決定「哪些意見值得內化為自有規格」。

---

## 0. 定位決策（建議）

| 層                 | SSOT                                                 | taste-skill 的角色                          |
| ------------------ | ---------------------------------------------------- | ------------------------------------------- |
| 產品規格／契約     | `specs/openapi`、`specs/policies`、interface-roadmap | 無角色（out of scope，其自述亦然）          |
| 設計 token／主題   | explore-design-sdk（PALETTE.md、application maps）   | 無角色；不得覆寫 token 決策                 |
| 版面品質／反模板   | **本文件的 checklist（自有、在地化）**               | 素材來源：萃取規則，標注出處                |
| Agent 產 UI 工作流 | AGENTS.md / `.cursor/skills`                         | 可選：僅對 marketing/developer surface 掛用 |

**不建議** `npx skills add` 裝成全域規則：v2 為 pre-release、其設計對象是 landing/portfolio、且我們要的是「參考意見而非固定模板」。做法改為**萃取內化**——把通過討論的規則寫進自有 checklist，保留出處以便追蹤上游更新。

---

## 1. Surface 分區（套用範圍的前提）

依 taste-skill 自身的 out-of-scope 聲明（dashboards、dense product UI、data tables、multi-step forms 明列不適用），先為 sitemap 每頁標注 surface：

| 頁面                                      | Surface                          | taste-skill 適用度                                                |
| ----------------------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| `/`（chat 預設）                          | product + marketing 混合         | 中：首屏敘事、empty state、prompt 建議卡可用；chat 互動流不歸它管 |
| `/?view=dashboard`                        | data surface                     | 低：只取反 fake-UI／反裝飾原則當 review 項                        |
| `/catalog-search`、`/metadata`            | product/data surface             | 低到中：列表節奏、empty/loading 態可參考；資訊架構不動            |
| `/items`、表單                            | product surface                  | 低：表單規則已有（label 上、error 下）與其一致                    |
| `/dishes`、`/recipes`（列表/詳情）        | marketing-ish（dataset landing） | 中：敘事與版面家族多樣性可參考                                    |
| `/developers` 總覽、SDK quick start       | developer surface                | 中高：最適合套的區域                                              |
| `/developers/apis/:apiId`（三欄 try-it）  | dense product UI                 | 低：明確 out of scope                                             |
| `/insights`                               | data surface                     | 低                                                                |
| `/release-notes`、對外 landing/docs intro | marketing surface                | 高                                                                |

---

## 2. 引入清單（逐項待議）

### 2.A 建議「直接採用」（surface 無關、與現有規格相容）

| #   | 規則（出處：SKILL.md 章節）                                                                                                                                    | 落點                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| A1  | **四態完整性**：每個資料畫面必備 loading（形狀吻合 skeleton）/ empty / error / tactile feedback（§4.5）                                                        | DESIGN_SYSTEM.md + M6 E2E 驗收項；SDK ux tier（Skeleton/EmptyState）已備 |
| A2  | **對比三檢**：Button/Form/CTA 全過 WCAG AA（4.5:1，大字 3:1）；照片底按鈕需 scrim（§4.6）                                                                      | DESIGN_SYSTEM.md review checklist                                        |
| A3  | **三個 Lock**：Page Theme Lock（頁面單主題不反轉）、Color Consistency Lock（accent 全頁一致）、Shape Consistency Lock（單一圓角系統）（§4.2/4.4）              | 與 SDK 單 map 供裝天然相容，寫成明文                                     |
| A4  | **反 fake-UI**：禁 div 假截圖、假精確數字（無來源的 92%）、假 logo 牆、假 avatar/人名（§9.D/9.E）                                                              | review checklist；demo 資料一律標注 mock                                 |
| A5  | **Motion motivated**：每個動畫能一句話說出目的；`prefers-reduced-motion` 預設尊重；禁 `window.addEventListener('scroll')`（§5）                                | DESIGN_SYSTEM.md；SDK motion tokens 補用途註記                           |
| A6  | **Copy self-audit**：出貨前重讀所有可見字串，刪 AI 腔（Elevate/Seamless 類 filler verbs 的中文對應：「賦能」「極致」「重新定義」）（§4.10/9.D）                | review checklist（在地化詞表）                                           |
| A7  | **版面家族反重複**：同 layout family 每頁最多一次；左右交錯最多連續 2 段（§4.7）                                                                               | marketing/developer surface 的 checklist 項                              |
| A8  | **Redesign 先 audit**：改版前記錄 brand tokens / IA / 保留與淘汰清單 + 現況 dial 估值；現代化槓桿順序 typography → spacing → color → motion → hero 重組（§11） | **直接用於 R1 排版改善的執行順序**（見 §5）                              |

### 2.B 建議「改造後採用」（需在地化或映射到 token）

| #   | 原規則                                                               | 改造提案                                                                                                                      |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| B1  | 三 dials（DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY）      | 不引入 dial 機制本身，改為 **per-surface preset** 映射到 SDK spacing/motion token（見 §4）；密度變化＝換 token 值，不是換規則 |
| B2  | Design Read（產 UI 前一行宣告 page kind/audience/vibe）              | 納入 agent 工作流：產 UI 前輸出 design read + **surface tag**；模糊時只問一題                                                 |
| B3  | Pre-flight check（60 項）                                            | 裁剪為 **20 項左右自有 checklist**（§6 草案），去除 landing 專屬項（hero 20 字上限等只掛 marketing surface）                  |
| B4  | Em-dash ban                                                          | 英文文案適用；**中文在地化**：規範全形標點、禁英文 em-dash 混入中文、行長以字數計（body 35–42 全形字）                        |
| B5  | Eyebrow restraint（每 3 section 最多 1 個 uppercase 小標）           | marketing surface 採用；product surface 的欄位標籤不受限                                                                      |
| B6  | 每 section 預設形狀（短標題 ≤8 字 + 短段落 ≤25 字 + 一個視覺或 CTA） | 中文化字數（標題 ≤12 全形字、段落 ≤40 全形字），掛 marketing/developer surface                                                |

### 2.C 建議「不採用」（與現有體系衝突或不適用）

| #   | 原規則                                             | 不採用理由                                                                                                                                        |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Design system mapping 表（Fluent/Carbon/Polaris…） | 我們有自有 SDK；後台標準已定 Untitled UI（portal-untitled map）                                                                                   |
| C2  | Stack 預設（Next.js RSC + Motion + GSAP）          | 本 repo 是 Remix/React Router；動效走自有 motion tokens 與 vue-motion promote 路徑                                                                |
| C3  | Serif-as-default ban、Fraunces 禁用                | 我們的和紙編輯風 serif display 是**明文品牌決策**（PALETTE.md + S2.6 token），正屬其自己允許的例外（brand-mandated editorial）；不因此換字體      |
| C4  | Premium beige+brass palette ban                    | 我們暖色盤出自和色體系 + Realtime Colors 明示選擇，非 AI 慣性 default；但**接受其精神**：新增主題時做 palette-rotation 檢查（不連續產出同族米金） |
| C5  | Inter 避用、lucide-react discouraged               | body 用 Inter 屬其允許的 neutral 案例；icon 換族成本高收益低。列為 open question 不強制                                                           |
| C6  | image-gen 參考圖流程（imagegen-* skills）          | 領域是 mock-first 產品 UI，非 marketing 素材產線；需要時個案處理                                                                                  |

---

## 3. 衝突點備忘（討論用）

1. **serif 與暖色**：taste-skill 把「創意案就上 serif／米金色」列為頭號 AI-tell。我們的組合之所以成立，是因為它有**體系出處**（和色、PALETTE.md、token 三層）與**一致執行**（全站單一主題 lock）。結論方向：把「有意圖的證據」寫進 DESIGN_SYSTEM.md，反模板的重點是「不無意識地選」，不是「不准選」。
2. **它的 anti-default 精神與我們的 token 體系同構**：它反對的是「跳過 brief 直接套 LLM 預設美學」；我們反對的是「跳過 token 直接寫死色值」。兩者可以合併成一條原則：**所有視覺決策都要有可追溯的出處（brief 或 token）**。
3. **dashboard/資料介面**它自己讓位：density 8-10 檔的建議（1px 分線、`font-mono` 數字、無卡片框）反而值得 `/insights` 與 API explorer 參考——這是它 out-of-scope 區裡少數可撿的具體意見。

---

## 4. Per-surface preset 提案（dial → token 映射）

不引入 dial 數字，改用語意 preset（值 = SDK token）：

| Surface                                              | 版面變化           | 動效                 | 密度（space.section / stack）                                                    | 備註                                  |
| ---------------------------------------------------- | ------------------ | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| marketing（landing、release-notes、dataset landing） | 中高（非對稱可用） | 中（motivated only） | 寬鬆 4rem / 1.25rem（portal map 現值）                                           | 和紙編輯風完整表達                    |
| chat 首頁                                            | 中                 | 低中                 | 寬鬆                                                                             | 敘事區塊 + 建議卡；互動流不套         |
| product（catalog/metadata/items）                    | 低（可預期優先）   | 低                   | 標準 3rem / 1rem（enterprise 值）                                                | 一致性 > 個性                         |
| data（insights、dashboard 總覽）                     | 低                 | 低                   | 緊湊（提案新增 `space.section` 緊湊檔 2rem；數字 `font-mono`、1px 分線、少卡片） | 取自 density 8-10 檔建議              |
| developer（/developers 總覽、SDK docs）              | 中                 | 低中                 | 標準                                                                             | 文件可讀性優先，行寬 ≤ 65ch/40 全形字 |

→ 若同意，落地方式：SDK 增加 `portal-dense`（或 semantic 加 `space.section-dense`）供 data surface 用；不新增 dial 概念。

---

## 5. R1 排版改善的執行順序（採 redesign protocol）

「介面排版不順眼」的處理採其現代化槓桿順序，先 audit 後動手：

1. **Audit**：對現有每頁記錄——用了哪些 token、哪些寫死值、layout family 重複處、四態缺漏、surface tag。
2. **Typography**（風險最低、視覺提升最大）：display/body token 已入（S2.6），逐頁套 `font-display` 與行寬上限。
3. **Spacing & rhythm**：以 `space.section/stack/gutter` 統一節奏（目前鬆散感主因）。
4. **Color 校準**：檢查 Color Consistency Lock（有無 section 級走鐘）。
5. **Motion 層**：僅 motivated 動效。
6. **關鍵 section 重組**：最後才動結構（sidebar、首頁 hero）。

---

## 6. UI Review Checklist 草案 v0（在地化，待議後定版）

**全 surface 通用**

- [ ] 視覺決策可追溯（token 或明文規格，無寫死色值/字級）
- [ ] 單主題不反轉；accent 全頁一致；單一圓角系統
- [ ] Button/Form/CTA 對比過 WCAG AA；焦點環可見
- [ ] 四態齊備：loading（形狀吻合）/ empty / error / tactile
- [ ] 無 fake UI：假截圖、無來源精確數字、假人名/頭像（mock 一律標注）
- [ ] 動效皆有目的；尊重 `prefers-reduced-motion`；無 scroll listener
- [ ] 中文排版：全形標點一致、無英文 em-dash 混入、body 行長 ≤ 42 全形字
- [ ] 文案自審：刪「賦能／極致／重新定義／無縫」類 filler；一頁一種語氣
- [ ] mobile 摺疊逐段明示；`min-h-[100dvh]`
- [ ] dark／light 兩模式皆檢視

**marketing / developer surface 加驗**

- [ ] 首屏：標題 ≤ 2 行、說明 ≤ 40 全形字、CTA 免捲動
- [ ] 同 layout family 每頁 ≤ 1；左右交錯 ≤ 連續 2 段
- [ ] uppercase 小標每 3 section ≤ 1
- [ ] CTA 語意不重複（同意圖同標籤）；logo/引用皆真實或標注

**data surface 加驗**

- [ ] 數字 `font-mono`；分隔用 1px 線或留白，不堆卡片
- [ ] 長清單換元件（分群/tabs/虛擬列表），不加長清單

---

## 7. 藝術人文研究參考庫（提案，供排版發想）

規則管下限，參考養上限。建議在 SDK `docs/design-references.md` 增設研究庫，每次 surface 改版前做一頁研究筆記（3–5 個參考 + 為什麼 + 取什麼）：

**書（編輯與網格的根）**：Josef Müller-Brockmann《Grid Systems in Graphic Design》、Emil Ruder《Typographie》、Jan Tschichold《The New Typography》、Robert Bringhurst《The Elements of Typographic Style》、原研哉《白》《Designing Design》、谷崎潤一郎《陰翳礼讃》（間・余白・陰影的美學基礎，直接支撐和紙編輯風）。

**站（持續巡）**：[Japan Web Design Gallery](https://japanwebdesign.com/)（日系網站策展）、Fonts In Use（真實排版案例庫）、Letterform Archive（字體與印刷史料）、Typographica（字體評論）、The Gourmand / Kinfolk / Monocle（紙本編輯節奏）、MoMA / Cooper Hewitt（館藏數位化的資訊密度處理）、[Utsubo 日系網頁設計指南](https://www.utsubo.com/blog/japanese-web-design-style-guide)（Mincho 於 heritage/editorial 的使用脈絡）。

**用法**：marketing surface 取編輯節奏與餘白；data surface 反向取 Monocle/館藏索引的高密度排法；developer surface 取 Fonts In Use 的規格式呈現。

---

## 8. 待議決策清單

| #   | 問題                                      | 建議                                                                                                                                                              |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | ~~checklist v0（§6）定版？~~              | ✅ 2026-07-08 定版為 [ui-review-checklist.md](./ui-review-checklist.md)，DESIGN_SYSTEM.md 已連結                                                                  |
| D2  | ~~per-surface preset 是否落 SDK token？~~ | ✅ 2026-07-08：SDK semantic 加 `space.section-dense`（2rem）/`space.stack-dense`（0.75rem），enterprise 給值全主題繼承；portal tailwind 映射 `p-section-dense` 等 |
| D3  | ~~Design Read 是否進 AGENTS.md？~~        | ✅ 2026-07-08：AGENTS.md「UI 產出規則」段——全 surface 標 tag；marketing/developer 必填一行 Design Read；出貨前過 checklist                                        |
| D4  | ~~body 字型？~~                           | ✅ 維持 Inter（+ Noto Sans TC fallback）：個性由 serif display 承擔，body 職責是中文混排穩定                                                                      |
| D5  | ~~taste-skill 本體裝不裝？~~              | ✅ 不裝，用萃取版（ui-review-checklist.md）；v2.0.0 stable 後重新評估一次                                                                                         |
