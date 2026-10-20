# Product analytics events

**Type:** spec · **Weight:** 2

Closed Zod schemas in `packages/shared-contracts/src/analytics.contract.ts`.
No query text, URLs, or free-form property bags.

| Name               | Surface                  | Properties                                 |
| ------------------ | ------------------------ | ------------------------------------------ |
| `search_submitted` | `chat`, `catalog_search` | `queryLength`                              |
| `answer_rendered`  | `chat`                   | `hasSummary`, `sourceCount`, `durationMs`  |
| `citation_clicked` | `chat`                   | `kind` (`internal` \| `external`), `index` |

Existing governance events (`task_completed`, `ai_fallback_taken`,
`hitl_intervened`, `access_request_submitted`) stay in the same union.

Client emission is no-op unless `VITE_ANALYTICS_ENABLED=1`.
