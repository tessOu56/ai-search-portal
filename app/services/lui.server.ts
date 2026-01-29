export type LuiSource = {
  title: string;
  url: string;
};

export type LuiResponse = {
  summary: string;
  answer: string;
  confidence: number;
  sources: LuiSource[];
  nextSteps: string[];
};

export function buildLuiResponse(query: string): LuiResponse {
  return {
    summary: `已理解你的問題：「${query}」。我會先給你結論，再補上依據與下一步。`,
    answer:
      "建議先釐清需求範圍與限制條件，接著找出 2-3 個可信來源交叉驗證，最後整理成可執行的行動清單。這樣可以在資訊量龐大的情境下，依然快速做出正確判斷。",
    confidence: 0.78,
    sources: [
      {
        title: "Remix 官方文件",
        url: "https://remix.run/docs",
      },
      {
        title: "AI 搜尋最佳實務",
        url: "https://ai-search-portal.local/guide",
      },
    ],
    nextSteps: [
      "補充你目前的情境限制或目標",
      "選擇一個來源作為主要依據",
      "把答案轉成可執行任務清單",
    ],
  };
}

export function splitToTokens(text: string) {
  return text.split(" ");
}
