---
name: uiux-rwd-sitemap
description: >-
  Enforce RWD no-break layouts (375/768/1280), human sitemap/IA pages with
  performance-conscious visuals, and anti-slop UI gates. Use when editing
  storefront/portal UI, navigation, home motion, tables/grids, or site-map routes.
---

# UIUX — RWD + Sitemap + Perf

## When to apply

Any change to layout, nav, home, catalog/metadata tables, footer, or human sitemap/IA pages on **Portal** or **Plinth**. Read this skill before coding; pair with the repo UI checklist if present (`docs/product/ui-review-checklist.md`).

## Sources (extracted, not installed wholesale)

- Leonxlnx/taste-skill `design-taste-frontend` — motion purpose, density dial, anti fake-UI, three locks
- Community/Anthropic frontend-design — distinctive type/hierarchy; avoid generic AI purple/Inter slop
- Repo tokens stay SSOT (explore-design / Plinth `visual-tokens`) — never override with skill aesthetics

## Hard gates (must pass)

### RWD matrix

Test or reason about **375 / 768 / 1280**:

1. No horizontal page overflow (`document` / main content).
2. Primary nav + primary CTA visible without being covered by fixed/sticky chrome.
3. No section that exists only on `md+` without a mobile equivalent (drawer, bottom nav, or stacked links).
4. Multi-column data grids → below 768: **card stack** or `overflow-x-auto` with visible scroll affordance.
5. Prefer `min-h-[100dvh]` / `svh` over `h-screen` for heroes.

### Motion / perf

1. Every animation needs a one-line purpose (hierarchy / feedback / state). “Looks cool” fails.
2. Respect `prefers-reduced-motion`.
3. **Forbidden:** `addEventListener('scroll')` → React `setState` every frame on a page root. Use CSS scroll-driven animation, `requestAnimationFrame` throttle, or isolate state in a tiny child.
4. Prefer CSS transforms/opacity; avoid layout thrash on scroll.
5. Human sitemap: lazy-render long link lists (IntersectionObserver / pagination); no 3D / full hydration of every node.

### Sitemap / IA UI

1. One job per page: orient + link; not a second home hero dump.
2. Brand readable; sections match product sitemap docs (Plinth `docs/product/sitemap.md`; Portal interface-roadmap primary journeys).
3. Entry from footer (and optionally header). Keep `/sitemap.xml` as machine SEO only — do not replace it with the HTML page.
4. Mark demo/mock journeys clearly on Portal.
5. **Portal human inventory SSOT:** `app/lib/ux-sitemap.ts`. `/site-map` must render only that list. Adding a human-facing route (including nested `/items/:id`, `/metadata/:id`, …) requires a new inventory row; missing rows are a regression. Do not list `/api/*` or `sitemap.xml`.

### Product vs marketing chrome

- `/` stays marketing (BrandMark, atmosphere).
- Deep pages use `ProductPageShell` + SDK DataTable / EmptyState / Skeleton / Panel. Do not copy BrandMark heroes onto tool pages.
- Public UI must not show ticket numbers or “W3 shell” badges.

### Visual taste (short)

1. Theme / color / radius locks — one system per page.
2. WCAG AA for text/CTA contrast.
3. Four states: loading / empty / error / tactile where data appears.
4. No fake stats, fake avatars, or unlabelled mock precision.

## Implementation order

Font/spacing → color → motion → structure. Stop when gates pass.

## Acceptance snippet (paste in PR)

```
RWD: 375 / 768 / 1280 — no overflow; nav+CTA visible; tables→cards|scroll
Perf: no per-scroll root setState; reduced-motion OK
Sitemap: human route + footer link; XML unchanged
Checklist: surface tag + locks + four states
```
