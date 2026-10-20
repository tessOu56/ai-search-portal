# Accessibility report — WCAG 2.2 AA

**Type:** report · **Weight:** 3  
**Surface:** marketing (`/`) + product (catalog, metadata, chat, governance)  
**Date:** 2026-10-20

## Method

- Automated: Playwright + `@axe-core/playwright` in `e2e/a11y.spec.ts`.
- Tags: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`.
- Gate: no `critical` or `serious` violations. Run as part of CI
  `e2e` (`pnpm run test:e2e` / `pnpm run test:a11y`).
- Manual checks in the same spec: skip-link is the first tab stop; catalog
  search has an accessible name; chat composer stays labelled after a turn.

## Pages

| Page            | Path                                        | Auth              |
| --------------- | ------------------------------------------- | ----------------- |
| Home / ask      | `/`                                         | none              |
| Catalog         | `/catalog-search`                           | none              |
| Metadata        | `/metadata`                                 | none              |
| Insights        | `/insights`                                 | none              |
| Chat (one turn) | `/?q=…`                                     | requester session |
| My requests     | `/my-apis?sessionRole=requester`            | requester session |
| Access review   | `/access-requests/review?sessionRole=owner` | requester session |

## Fixes shipped with this report

- Streaming answers: polite `role="log"` live region announces **waiting**,
  then the **summary / body** — not every token (already the contract;
  now explicit `role="log"` + `aria-relevant="additions"`).
- After a reply, **focus stays on the composer** (do not jump into the
  transcript). The live region is the announcement.
- Home LCP headline is static (no opacity fade), which also helps
  `prefers-reduced-motion` users see the title immediately.
- Color-contrast is **enabled** in axe (was disabled). Portal remaps:
  - `.text-primary` (shadcn `--accent-brand` rust `#bd8356`, 3.13:1 on
    cream) → `var(--accent-strong)` (`#8a5a33`, ≥ 4.5:1).
  - `--status-info` (`#0284c7` + white ≈ 4.0:1) → `#0369a1` (sky-700).
  - SDK Callout info (`text-brand-700` `#b98413` on `bg-brand-50` `#fff9e8`,
    3.13:1) → `var(--text-primary)`.
    SDK primitives are unchanged; this is a portal AA override.

## Keyboard / focus / labels

- Skip link → `#main-content` (`tabIndex={-1}`).
- Composer: visible/`sr-only` label, submit `aria-label`, mic labelled,
  `aria-busy` while streaming.
- Catalog / metadata facets use `aria-current` for the selected filter.
- Target size: composer icon button uses the SDK `icon` size (≥ 24×24,
  WCAG 2.2 2.5.8).

## Reduced motion

- `usePrefersReducedMotion` / `useReducedMotion` on composer typewriter,
  star cursor, nav progress, and remaining home motion.
- CSS: `app/styles/motion.portal.css`, atmosphere, brand-mark.

## How to re-run

```bash
pnpm run test:a11y
```
