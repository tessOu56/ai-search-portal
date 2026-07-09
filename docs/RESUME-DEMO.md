# Resume demo — ai-search-portal

> Portfolio SSOT: [platform-command/planning/career/resume-portfolio.md](https://github.com/tessOu56/platform-command/blob/main/planning/career/resume-portfolio.md)

## Problem → solution (30 seconds)

**Problem**: Catalog-style search needs filterable, paginated results without binding UI to a live enterprise API during prototyping.

**Solution**: Remix mock-first shell with typed view models, URL-driven `?type=` filter, and pagination — plus labs for eval/guardrails.

## Architecture (1 minute)

```text
app/routes/catalog-search._index.tsx
  → getCatalogSearchPlaceholder (server)
  → CatalogSearchPanel (UI)
  → catalog-search.types.ts (contract)
labs/design-vibe/GAP-REPORT.md (P0 waiver + gaps)
```

Cross-stack alignment: field names match [py-able-labs](https://github.com/tessOu56/py-able-labs) Ex02 API (`itemType`, `pageSize`).

## Local demo (3 minutes)

```bash
pnpm install
pnpm dev
```

1. Open `http://localhost:5173/catalog-search`
2. Show filter by type (API / Dictionary) via URL or UI
3. Show pagination on mock results
4. **Governance flow (Journey C)**: open `/metadata/tbl-customers?purpose=marketing&role=analyst` —
   policy flips to `need_approval` → Request access → HITL confirm → status lands on
   `pending_approval` with audit flag. This exact path is covered by **Playwright E2E**
   (`e2e/access-request.spec.ts`, runs on every PR): assertions target the **status machine
   and policy state**, not UI copy — AI can be added later without breaking the baseline.
5. **Dual-path**: in chat, if the stream fails, `AiFallbackPanel` preserves the query and
   prefills `/catalog-search?q=…` — every AI path degrades to a manual, auditable one.
6. **Golden demo (Journey A)**: on `/`, click one of the 3 fixed questions —
   streaming, tool status, confidence + sources render live; the "Mock agent"
   badge is honest labelling (pipeline is real, LLM is not).
7. Mention: SSE chat + guardrails in `labs/` (optional 30s if time)

### Metadata context catalog (optional 2 minutes)

1. Open `http://localhost:5173/metadata` — default **Enterprise analytics** pack (MAU / `customer_profile` / PII policy).
2. Use **Context pack** dropdown → switch to **Agri supply chain**; show procurement assets and metrics API.
3. Narrative: same platform (catalog, OPA, GenUI, MCP); domain knowledge lives in swappable packs, not core code.

## Public URL path

| Step | Action                                                            |
| ---- | ----------------------------------------------------------------- |
| 1    | Resolve STOP-001 (Vercel signup) or self-host                     |
| 2    | Deploy `main`; set `deploy.url` in platform-command registry      |
| 3    | Add live URL to resume + README badge                             |
| 4    | Fallback until then: link GitHub + screen recording GIF in README |

## Demo checklist (before interview)

- [ ] `/catalog-search` loads without console errors
- [ ] `?type=API` filters mock rows
- [ ] Pagination changes page in URL or UI
- [ ] `pnpm run test:e2e` green (access-request baseline, offline)
- [ ] `pnpm run lint` + `typecheck` pass
- [ ] No links to company mirror repos in slides

## Resume bullets (pick one)

**Product engineer**

> Built a Remix catalog-search prototype with mock-first contracts, URL filters, and pagination; documented GAP/waiver process and eval labs for regression safety.

**Senior frontend**

> Led Remix feature-module layout for catalog-search; aligned TypeScript view models with a reference FastAPI contract for cross-team integration.

## Do not say in interview

- "I mirrored company repos on GitHub" — say **original prototype informed by domain experience**
