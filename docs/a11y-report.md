# Accessibility — WCAG 2.2 AA

Axe gate and remaps for this change. Not a roadmap.

## Method

- Playwright + `@axe-core/playwright` in `e2e/a11y.spec.ts`.
- Tags: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`.
- Fail on `critical` or `serious`. CI: `pnpm run test:e2e` / `pnpm run test:a11y`.

Pages: `/`, `/catalog-search`, `/metadata`, `/insights`, `/?q=…` (requester),
`/my-apis?sessionRole=requester`, `/access-requests/review?sessionRole=owner`.

## Remaps (SDK tokens unchanged)

- `.text-primary` (`#bd8356` on cream, 3.13:1) → `var(--accent-strong)`.
- `--status-info` (`#0284c7` + white ≈ 4.0:1) → `#0369a1`.
- Callout info (`#b98413` on `#fff9e8`, 3.13:1) → `var(--text-primary)`.

## Behaviour

- Streaming answers: polite `role="log"` (waiting, then summary — not tokens).
- Focus stays on the composer after a reply.
- Skip link is the first tab stop → `#main-content`.
- Color-contrast is enabled in axe (was disabled).
- Reduced motion: existing `usePrefersReducedMotion` / `motion.portal.css`.

```bash
pnpm run test:a11y
```
