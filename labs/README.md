# Labs

Experimental packages — **promote** to `packages/` or `app/` when stable; do not break v1 mock-first product contract.

| Lab                             | Package                             | Status                                      |
| ------------------------------- | ----------------------------------- | ------------------------------------------- |
| [eval-runner](eval-runner/)     | `@ai-search-portal/lab-eval-runner` | MVP — offline golden cases                  |
| [design-vibe](design-vibe/)     | `@ai-search-portal/lab-design-vibe` | MVP — Downloads explorer → Figma MCP bridge |
| [observability](observability/) | _(compose only)_                    | Langfuse self-host                          |
| on-device-media _(planned)_     | —                                   | Parallel track — WebCodecs → WebGPU POC     |

## Commands

```bash
pnpm --filter @ai-search-portal/lab-eval-runner test
pnpm --filter @ai-search-portal/lab-design-vibe typecheck
pnpm turbo run test --filter=@ai-search-portal/lab-*
```

## Worktree (suggested)

See `develop-md/docs/worktrees/platform-2026-worktrees.md`.
