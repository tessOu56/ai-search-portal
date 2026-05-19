/**
 * Guardrails: length, basic prompt-injection heuristics (v2).
 */

export class GuardrailViolation extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GuardrailViolation";
    this.code = code;
  }
}

const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    label: "ignore_instructions",
  },
  {
    pattern: /disregard\s+(your|the)\s+(system|safety)/i,
    label: "disregard_safety",
  },
  {
    pattern: /you\s+are\s+now\s+(in\s+)?(dan|devmode|unrestricted)\s+mode/i,
    label: "jailbreak_mode",
  },
  {
    pattern: /reveal\s+(the\s+)?(system|hidden)\s+prompt/i,
    label: "reveal_prompt",
  },
  { pattern: /<\s*script[\s>]/i, label: "script_tag" },
];

const MAX_QUERY_LENGTH = 16_000;

export function scanQueryableText(query: string): GuardrailViolation | null {
  if (query.length > MAX_QUERY_LENGTH) {
    return new GuardrailViolation("QUERY_TOO_LONG", "Query too long");
  }
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return new GuardrailViolation("EMPTY_QUERY", "Query is empty");
  }
  for (const { pattern, label } of INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      return new GuardrailViolation(
        "PROMPT_INJECTION",
        `Blocked suspicious pattern: ${label}`
      );
    }
  }
  return null;
}

export function assertQueryableText(query: string): void {
  const violation = scanQueryableText(query);
  if (violation) throw violation;
}
