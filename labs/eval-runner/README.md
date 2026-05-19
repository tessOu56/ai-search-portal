# lab-eval-runner

Offline evaluation for `@ai-search-portal/agent-core` mock stream (Phase 5 productization — eval dataset).

## Run

```bash
pnpm --filter @ai-search-portal/agent-core build
pnpm --filter @ai-search-portal/lab-eval-runner test
pnpm --filter @ai-search-portal/lab-eval-runner run eval
```

## Fixtures

Edit `fixtures/golden.jsonl` — one JSON object per line:

- `expectedKeywords` — matched case-insensitively across all SSE payloads
- `expectRag` — requires `internal.rag_step` events

## Promote criteria

- [ ] CI job `turbo run test --filter=@ai-search-portal/lab-eval-runner`
- [ ] Score export JSON for dashboards
- [ ] Real LLM cases in separate fixture file (opt-in)
