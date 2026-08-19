# ai-search-portal — how-to (not phase SSOT)

> **Superseded as phase SSOT.** Stages, tickets, and surface completeness live in private **platform-command**:
> `planning/projects/ai-search-portal.md` · `planning/projects/surface-completeness.md` · `planning/tickets/`.
>
> This public file is **setup / quality gates / demo links only**. Do not add roadmaps here.

## Demo

- Live: https://ai-search-portal.vercel.app
- Click-through: [`docs/RESUME-DEMO.md`](./RESUME-DEMO.md) (Journey C)
- Public wording: [`docs/PUBLIC-NARRATIVE.md`](./PUBLIC-NARRATIVE.md)

## Local

```bash
pnpm install
pnpm run dev
pnpm run pr-gate
```

Quality gates (do not skip before push):

```bash
pnpm run build && pnpm run test && pnpm run lint:ci
pnpm run test:labs && pnpm run eval:offline
```

Agent workflow: [`docs/agent-collaboration.md`](./agent-collaboration.md) · [`AGENTS.md`](../AGENTS.md)

## Architecture notes (code, not a roadmap)

- Production path is the Remix BFF on Vercel. `backend/` is a parallel reference implementation.
- UI kits re-export `@is_tess/components` from `app/components/ui/*`.
- Domain pages `/dishes` and `/recipes` load via Remix loaders (seed); they are not public REST yet.
