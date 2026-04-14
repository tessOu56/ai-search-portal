/**
 * 基本 guardrails（可擴充為 PII／prompt-injection 檢查）。
 */

export function assertQueryableText(query: string): void {
  if (query.length > 16_000) {
    throw new Error("Query too long");
  }
}
