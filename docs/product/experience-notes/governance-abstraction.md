# Experience note — Governance abstraction (G1)

> Portfolio STAR draft for sync into
> [develop-md/career/experience-ledger.md](https://github.com/tessOu56/develop-md/blob/main/career/experience-ledger.md).
> Ticket: T-2026-023 / T-2026-025 · Date: 2026-07-29

## Situation

Enterprise catalog prototypes often bolt AI onto search while access requests stay
ad-hoc forms. Interview audiences need a **clickable, auditable** governance path
without a live IdP or OPA cluster.

## Task

Ship a mock-first **Journey C** in ai-search-portal: detail → apply → owner review →
my-apis tracking, with a single lifecycle vocabulary shared by domain YAML, Zod
contracts, MSW, and UI.

## Action

- Domain SSOT `specs/domain/metadata-access.yaml` (`draft` / `pending_approval` /
  `approved` / `denied` / `expired`) with ticket aliases documented.
- Contracts only via `@ai-search-portal/contracts`; in-memory store + review API;
  MSW handlers share the store (unique request ids so list/review tests stay honest).
- UI: metadata detail (owner / PII / terms), `/my-apis`, `/access-requests/review`
  with `?sessionRole=` personas; Playwright E2E on apply + review paths.

## Result

- PR-gated E2E asserts **status machine + policy**, not copy (`e2e/access-request.spec.ts`,
  `e2e/access-review.spec.ts`).
- Demo script: [docs/RESUME-DEMO.md](../../RESUME-DEMO.md) (5-min + 20s cut).
- Abstraction reusable across context packs — domain knowledge swaps; governance spine does not.

## Export-ok resume line

> Designed a contract-first metadata access lifecycle (apply → HITL review → permission
> tracking) with offline Playwright coverage so AI-assisted discovery still degrades to an
> auditable manual path.
