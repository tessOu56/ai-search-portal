# AI Search Portal

Reference product for **trusted AI data discovery**: accelerate search and access requests with an always-available manual path and an auditable human-in-the-loop flow.

**Live demo:** [https://ai-search-portal.vercel.app](https://ai-search-portal.vercel.app)

## What this proves

1. **Dual-path** — Every AI flow has a matching manual UI. If streaming fails, `AiFallbackPanel` keeps the user query and hands off to catalog search (`?q=`).
2. **HITL governance** — Access requests: policy evaluation → human review → state machine (`approved` / `pending_approval` / `denied`) with audit flags. Covered by Playwright (`e2e/access-request.spec.ts`, required on PRs).
3. **Honest AI labels** — Replies include confidence and sources; default mode uses **offline fixtures** (optional live LLM only when a server-side key is set).

**Non-goals:** Not a full enterprise catalog SaaS (no connectors, multi-tenant billing, or compliance certifications). Domain knowledge lives in swappable context packs.

## Evidence

| Proof                  | Detail                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| Governance E2E         | 4 tests, PR-required, offline-capable                                                           |
| 10k-row virtualization | **10000 → 23 DOM nodes (−99.8%)** — [perf note](docs/perf/catalog-dictionary-virtualization.md) |
| Contracts              | OpenAPI codegen + Spectral + drift check + zod v4 in CI                                         |
| Offline AI eval        | `eval:offline` in CI (lab-eval-runner)                                                          |

UI tokens come from [explore-design-sdk](https://github.com/tessOu56/explore-design-sdk); this app does not own a separate design-token package.

## Try the main journey (local or live)

1. Catalog: `/catalog-search`
2. Request access: `/metadata/tbl-customers?purpose=marketing&role=analyst`
3. Review (demo role, **not** real auth): `/access-requests/review?sessionRole=owner`
4. Track: `/my-apis?sessionRole=requester`

Also: `/` (golden chat with offline fixture), `/catalog-search/dictionary` (virtualized list).

## Stack

- Remix v2 + React 18 + TypeScript + Vite
- Tailwind CSS
- Deploy: Vercel (or any Node host / Docker)

## Quickstart

```bash
corepack enable   # pnpm from packageManager field
pnpm install
pnpm run dev
```

Optional: set **server-side only** `OPENAI_API_KEY` for live LLM; without it the app stays on offline fixtures. Never commit `.env` or secret values — see [SECURITY.md](SECURITY.md).

Quality: `pnpm run lint` · `pnpm run typecheck` · `pnpm run test` · CI runs `lint:strict` + typecheck + knip + E2E.

## Architecture (short)

- `app/features/*` — feature modules
- `app/shared` — cross-feature helpers
- `app/services` — application services
- `app/routes` — Remix routes
- `packages/agent-core` — mock-first agent path

More: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), [CONTRIBUTING.md](CONTRIBUTING.md), [docs/PUBLIC-NARRATIVE.md](docs/PUBLIC-NARRATIVE.md).

## Deploy notes

Prefer linking the GitHub repo in your host’s dashboard. If you use GitHub Actions deploy workflows, store host tokens only in **GitHub Actions secrets / environments** — never in the repository. See [docs/runbooks/deployment.md](docs/runbooks/deployment.md) for operator detail.

## License

See [LICENSE](LICENSE). Security reports: [SECURITY.md](SECURITY.md).
