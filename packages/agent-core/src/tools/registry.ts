/**
 * Tool allowlist（Phase 3）。實際 tool 執行仍須經 domain API／契約。
 */

export const DEFAULT_ALLOWED_TOOLS = ["items.lookup", "rag.search"] as const;

export type AllowedToolName = (typeof DEFAULT_ALLOWED_TOOLS)[number];

export function isAllowedTool(name: string): name is AllowedToolName {
  return (DEFAULT_ALLOWED_TOOLS as readonly string[]).includes(name);
}
