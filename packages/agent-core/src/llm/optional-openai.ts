/**
 * Optional server-side LLM compose. Key stays in process env only — never
 * imported by client bundles. Falls back to caller fixture on any miss/error.
 */

import type { LuiResponse } from "../lui-mock.js";
import type { LocalDoc } from "../rag/local-store.js";

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_ANSWER_CHARS = 1_200;

export type OptionalLlmResult = {
  response: LuiResponse;
  mode: "live_llm";
};

function readApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key && key.length > 0 ? key : undefined;
}

function buildContextBlock(hits: LocalDoc[]): string {
  if (hits.length === 0) return "(no retrieved snippets)";
  return hits
    .slice(0, 4)
    .map((h, i) => {
      const title = h.title ?? h.id;
      const text = h.text.slice(0, 500);
      return `[${i + 1}] ${title}\n${text}`;
    })
    .join("\n\n");
}

/**
 * When OPENAI_API_KEY is set, compose an answer from retrieved snippets only.
 * Never throws — returns null so the caller keeps the offline fixture.
 */
export async function tryOptionalLlmCompose(args: {
  query: string;
  hits: LocalDoc[];
  fixture: LuiResponse;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<OptionalLlmResult | null> {
  const apiKey = readApiKey();
  if (!apiKey) return null;

  const configuredModel = process.env.OPENAI_MODEL?.trim();
  const model = configuredModel ? configuredModel : "gpt-4o-mini";
  const timeoutMs = args.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  args.signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: [
              "You are a catalog assistant for a public demo portal.",
              "Answer ONLY using the retrieved snippets.",
              "Do not invent assets, owners, or PII. Keep answers under 120 words.",
              "Prefer conclusion → sources → next steps.",
              "If snippets are insufficient, say so briefly and suggest catalog/metadata search.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Question:\n${args.query}`,
              `Retrieved snippets:\n${buildContextBlock(args.hits)}`,
            ].join("\n\n"),
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = body.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    const answer =
      raw.length > MAX_ANSWER_CHARS
        ? `${raw.slice(0, MAX_ANSWER_CHARS)}…`
        : raw;

    return {
      mode: "live_llm",
      response: {
        ...args.fixture,
        summary: `Live LLM compose for「${args.query}」(server key; retrieval-grounded).`,
        answer,
        confidence: Math.min(0.9, Math.max(0.55, args.fixture.confidence)),
      },
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    args.signal?.removeEventListener("abort", onAbort);
  }
}

export function hasOptionalLlmKey(): boolean {
  return Boolean(readApiKey());
}
