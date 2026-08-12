# Resume demo — ai-search-portal

> Portfolio SSOT: [platform-command/planning/career/resume-portfolio.md](https://github.com/tessOu56/platform-command/blob/main/planning/career/resume-portfolio.md)

## Interview framing (Dentscape × Bito)

- **Dentscape**: professional-tool journey — inspect → modify → trust → deliver via HITL dual-path (manual + AI fill with field markers).
- **Bito**: design-system consumption (`@is_tess/components` file: dep + Storybook/page-archetypes), contract+Mock governance APIs, `/vitals` + catalog-dictionary perf evidence.

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
4. **Governance flow (Journey C)** — see 5-minute script below (main demo)
5. **Dual-path**: in chat, if the stream fails, `AiFallbackPanel` preserves the query and
   prefills `/catalog-search?q=…` — every AI path degrades to a manual, auditable one.
6. **Lineage DAG (T-016)**: on a metadata detail with lineage, Kahn topological order is
   shown when acyclic; cycles surface an inline warning (`docs/architecture/lineage-kahn.md`).
7. **Golden demo (Journey A)**: on `/`, click one of the 3 fixed questions —
   streaming, tool status, confidence + sources render live; the mode badge
   shows **Offline fixture** (default) or **Live LLM** when a server-only
   `OPENAI_API_KEY` is configured. Fixture answers are query-aware with deep
   links into catalog／metadata. `?sessionRole=` is a **demo role switcher**,
   not authentication.
8. Mention: SSE chat + shared `stable-sse-client` + guardrails in `labs/` (optional 30s)
9. **Web Vitals (T-2026-115)**: open `/vitals` — live LCP/INP/CLS for this
   browser tab, no backend required; cross-reference with the measured
   catalog-dictionary numbers in `docs/perf/catalog-dictionary-measured.json`
   and see `docs/perf/vitals-panel.md` for the optional PostHog P75 path.

## Journey C — 5-minute governance script (T-2026-025)

Click-through for interviews / portfolio (mock-first, offline):

| #   | Step       | URL / action                                                                | Show                                                                                        |
| --- | ---------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Catalog    | `/catalog-search?type=API`                                                  | Filter + pagination; pick a metadata-linked result if shown                                 |
| 2   | Detail     | `/metadata/tbl-customers?purpose=marketing&role=analyst`                    | Owner, classification/PII, terms; policy `need_approval`                                    |
| 3   | Apply      | Request access → HITL confirm                                               | Status → `pending_approval` + audit flag; E2E in `e2e/access-request.spec.ts`               |
| 4   | Review     | `/access-requests/review?sessionRole=owner`                                 | Pending queue; approve / deny / edit (HITL server path also in `e2e/access-review.spec.ts`) |
| 5   | My APIs    | `/my-apis?sessionRole=requester`                                            | Requester tracking + permission status; draft submit / expire demo                          |
| 6   | Spec spine | Mention `specs/domain/metadata-access.yaml` + `@ai-search-portal/contracts` | Contract-first; no ad-hoc enums in UI                                                       |

Optional AI dual-path (T-020): on detail add `?aiFill=1` for Zod-validated AI form fill + HITL; `?aiFill=invalid` shows `AiFallbackPanel`.

### Twenty-second cut (作品集主戲)

1. Open detail with marketing/analyst (policy blocks).
2. Confirm HITL apply → land on pending.
3. Jump to owner review → approve → show My APIs granted.  
   Stop. Do not open GRAPH or other repos.

### Spec-driven pipeline (30s close)

Point at `packages/shared-contracts` + MSW handlers + `pnpm run lint:handlers` — the same path the PR gate uses.

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
