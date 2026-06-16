---
name: portal-contract-change
description: >-
  Use in ai-search-portal when changing APIs, SSE chat events, OpenAPI, MSW
  handlers, or packages/shared-contracts. Enforces spec-first and eval coverage.
---

# Portal contract change

## When to use

- 改 chat SSE、stable events、`/api/chat`
- 改 Items API、OpenAPI、`app/test/handlers.ts`
- 新增或修改 `packages/shared-contracts`

## Order (mandatory)

1. **specs/** — handler-mapping、event spec、`specs/openapi/openapi.yaml` if REST
2. **packages/shared-contracts** — Zod / types
3. **MSW** — `app/test/handlers.ts`（與 mapping 一致）
4. **Tests** — contract tests、`agent-core` stream tests
5. **app/** — routes、features、gateway mapping only after 1–4

## Verification

```bash
pnpm run codegen:openapi   # if OpenAPI touched
pnpm run test
pnpm run eval:offline      # if agent stream / RAG touched
pnpm run lint:handlers     # if MSW touched
```

## Gateway rule

- Internal events → `mapInternalSseToStable` in shared-contracts
- Do not add parallel fetch wrappers; use `app/services/chat-gateway.server.ts`

## Forbidden

- `fetch(url)` in components for API data
- Change stable event names without spec + eval golden update
- Edit `app/shared/contracts/*.contract.ts` (use package + re-export only)

## References

- [docs/conventions/data-test-driven.md](../../docs/conventions/data-test-driven.md)
- [specs/events/chat-stream.md](../../specs/events/chat-stream.md)
- [docs/architecture/ai-product/stable-chat-contract.md](../../docs/architecture/ai-product/stable-chat-contract.md)
