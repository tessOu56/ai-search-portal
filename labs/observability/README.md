# Labs — Observability (Langfuse)

Self-hosted Langfuse for LLM trace / eval linkage (Sprint 3).

## Start

```powershell
cd labs/observability
docker compose -f docker-compose.langfuse.yml up -d
```

- UI: http://localhost:3001 (default; see compose)
- Docs: https://langfuse.com/docs/deployment/self-host

## Portal integration

1. Set env on `agent-runtime` or Remix (`.env.local` only):

   ```
   LANGFUSE_PUBLIC_KEY=pk-...
   LANGFUSE_SECRET_KEY=sk-...
   LANGFUSE_HOST=http://localhost:3001
   ```

2. `packages/agent-core` uses `beginChatTrace` in `streamChatInternalEvents` when env is set:
   - Root trace `chat-stream` with query input
   - Child spans per RAG step (`rag.retrieve`, `rag.rerank`, `rag.compose`)
   - Generation `lui-mock` on success; trace `ERROR` on guardrail block
   - `flushAsync` after each completed stream

## Code review note

Do not commit real keys. Use `.env.local` only.
