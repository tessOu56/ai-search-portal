/**
 * Audit log 最小落盤（agentic 階段五先遣）。
 * 預設 in-memory（Vercel serverless 檔案系統唯讀）；設 AUDIT_LOG_PATH 時
 * 另 append JSONL（本機/自架環境）。路徑可 env 覆寫，符合 cowork-sandbox 腳本準則。
 * 耐久儲存（DB + 查詢分頁 + 檢視頁）屬階段五正式工作。
 */

import { randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import {
  type AuditEventContract,
  auditEventSchema,
} from "@ai-search-portal/contracts";

const memoryStore: AuditEventContract[] = [];

function tryAppendJsonl(event: AuditEventContract): void {
  const path = process.env.AUDIT_LOG_PATH?.trim();
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(event)}\n`, "utf8");
}

export type AppendAuditInput = Omit<AuditEventContract, "id" | "at">;

/**
 * 寫入 audit 事件。回傳實際寫入的事件；失敗回傳 null（呼叫端據此決定 auditLogged）。
 */
export function appendAuditEvent(
  input: AppendAuditInput
): AuditEventContract | null {
  try {
    const event = auditEventSchema.parse({
      ...input,
      id: randomUUID(),
      at: new Date().toISOString(),
    });
    memoryStore.push(event);
    tryAppendJsonl(event);
    return event;
  } catch {
    return null;
  }
}

/** 由新到舊列出事件。 */
export function listAuditEvents(limit = 50): {
  data: AuditEventContract[];
  total: number;
} {
  const bounded = Math.max(1, Math.min(limit, 200));
  return {
    data: [...memoryStore].reverse().slice(0, bounded),
    total: memoryStore.length,
  };
}

/** 測試用：清空 in-memory store。 */
export function resetAuditLogForTest(): void {
  memoryStore.length = 0;
}
