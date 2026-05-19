# Labs — Observability (Langfuse)

Self-hosted Langfuse for LLM trace / eval linkage (Sprint 3).

## Start

```powershell
pnpm run observability:up
# or:
cd labs/observability
docker compose -f docker-compose.langfuse.yml up -d
```

- UI: http://localhost:3001
- First visit: create account + project → copy **public** and **secret** keys
- Docs: https://langfuse.com/docs/deployment/self-host

## Portal integration

1. Copy `labs/observability/.env.langfuse.example` → repo root `.env.local` (never commit keys):

   ```env
   LANGFUSE_HOST=http://localhost:3001
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   ```

2. `packages/agent-core` uses `beginChatTrace` in `streamChatInternalEvents` when env is set:
   - Root trace `chat-stream` with query input
   - Child spans per RAG step (`rag.retrieve`, `rag.rerank`, `rag.compose`)
   - Generation `lui-mock` on success; trace `ERROR` on guardrail block
   - `flushAsync` after each completed stream

## Verify one trace (CLI)

```powershell
pnpm run observability:up
# set LANGFUSE_* in .env.local, then:
pnpm run observability:smoke
```

Open http://localhost:3001 → **Traces**; search for `langfuse-smoke` or the printed `traceId`.

## Verify via Remix chat (optional)

```powershell
# terminal 1
pnpm run observability:up
pnpm dev
```

Ensure `.env.local` has `LANGFUSE_*`, then open `/api/chat?q=hello` or use workspace chat. Trace should appear within ~10s.

## Stop

```powershell
pnpm run observability:down
```

## Code review note

Do not commit real keys. Use `.env.local` only.
