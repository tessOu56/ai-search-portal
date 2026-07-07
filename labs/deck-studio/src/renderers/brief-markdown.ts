/** B1 第一個 renderer：DeckDocument → brief.md / outline.md / script.md（純函式、零依賴） */
import type { DeckDocumentT } from "../schema/deck-document.js";

export function renderBrief(doc: DeckDocumentT): string {
  const m = doc.meta;
  return [
    `# Brief — ${m.title}`,
    "",
    `- **聽眾**：${m.audience}`,
    `- **目標**：${m.goal}`,
    `- **頁數**：${doc.slides.length}（上限 ${doc.constraints.maxSlides}）`,
    `- **語言**：${m.lang} · 版本 ${m.version}`,
    "",
    "## 關鍵訊息",
    "",
    ...doc.slides.map((s) => `- ${s.intent}`),
  ].join("\n");
}

export function renderOutline(doc: DeckDocumentT): string {
  return [
    `# Outline — ${doc.meta.title}`,
    "",
    ...doc.slides.map((s, i) =>
      [
        `## ${i + 1}. ${s.title}`,
        "",
        `> intent: ${s.intent} · layout: ${s.layout}`,
        "",
        ...s.bullets.map((b) => `- ${b}`),
        "",
      ].join("\n")
    ),
  ].join("\n");
}

export function renderScript(doc: DeckDocumentT): string {
  return [
    `# Script — ${doc.meta.title}`,
    "",
    ...doc.slides.map((s, i) =>
      [`## 第 ${i + 1} 頁 · ${s.title}`, "", s.notes || "（無講稿）", ""].join(
        "\n"
      )
    ),
  ].join("\n");
}
