/**
 * In-memory document store for local RAG (lab / dev). Promote to vector DB later.
 */

export type LocalDoc = { id: string; text: string; tags: string[] };

const DEFAULT_DOCS: LocalDoc[] = [
  {
    id: "auth-1",
    text: "Authentication uses OAuth2 and session cookies for the portal API.",
    tags: ["authentication", "security"],
  },
  {
    id: "search-1",
    text: "Catalog search supports filter_type for API vs Dataset assets.",
    tags: ["catalog", "search"],
  },
  {
    id: "metadata-1",
    text: "The customer_profile table in analytics contains PII fields email and phone.",
    tags: ["metadata", "pii", "catalog"],
  },
  {
    id: "agent-1",
    text: "The agent pipeline emits internal.rag_step before streaming answer chunks.",
    tags: ["agent", "rag"],
  },
];

export function retrieveLocal(
  query: string,
  docs: LocalDoc[] = DEFAULT_DOCS
): LocalDoc[] {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  const scored = docs.map((doc) => {
    const hay = `${doc.text} ${doc.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score++;
    }
    return { doc, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.doc)
    .slice(0, 3);
}
