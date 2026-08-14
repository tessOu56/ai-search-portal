# Demo guide — Journey C (governance)

Public showcase of the offline HITL access-request path. No employer / resume framing.

**Live:** [https://ai-search-portal.vercel.app](https://ai-search-portal.vercel.app)

## Local

```bash
pnpm install
pnpm run dev
```

## Journey C — click-through (mock-first)

| #   | Step    | URL / action                                             | Show                                                             |
| --- | ------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Catalog | `/catalog-search?type=API`                               | Filter + pagination                                              |
| 2   | Detail  | `/metadata/tbl-customers?purpose=marketing&role=analyst` | Policy `need_approval`                                           |
| 3   | Apply   | Request access → HITL confirm                            | Status → `pending_approval`; E2E in `e2e/access-request.spec.ts` |
| 4   | Review  | `/access-requests/review?sessionRole=owner`              | Approve / deny (demo role switcher, **not** auth)                |
| 5   | My APIs | `/my-apis?sessionRole=requester`                         | Requester tracking                                               |

Optional: `?aiFill=1` for Zod-validated AI form fill + HITL; `?aiFill=invalid` shows `AiFallbackPanel`.

### Twenty-second cut

1. Open detail with marketing/analyst (policy blocks).
2. Confirm HITL apply → pending.
3. Owner review → approve → My APIs granted.

Also: `/` golden chat (offline fixture by default), `/catalog-search/dictionary` (virtualized list), `/site-map`.

## Checklist

- [ ] `/catalog-search` loads without console errors
- [ ] `pnpm run test:e2e` green (offline)
- [ ] `pnpm run lint` + `typecheck` pass

See [docs/PUBLIC-NARRATIVE.md](PUBLIC-NARRATIVE.md) for what not to add to public docs.
