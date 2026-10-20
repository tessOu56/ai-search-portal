# Bundle size budget (T-2026-059)

Gate: `pnpm run size` (size-limit) after `pnpm run build`.

| Path                       | Limit           | Notes                                                      |
| -------------------------- | --------------- | ---------------------------------------------------------- |
| `build/client/assets/*.js` | **500 kB** gzip | Sum of client JS gzip; optional `*sentry*` chunks excluded |
| `route-home` `_index-*.js` | **40 kB** gzip  | Home route module only (shared chunks billed separately)   |
| `route-insights`           | **40 kB** gzip  | Insights shell; Recharts loads in a separate async chunk   |
| `route-catalog-search`     | **20 kB** gzip  | Catalog search route module                                |
| `route-metadata`           | **20 kB** gzip  | Metadata search route module                               |
| `route-vitals`             | **15 kB** gzip  | Local Web Vitals panel                                     |
| `shared-ui-root-chrome`    | **85 kB** gzip  | Root shell                                                 |

Evidence: CI job **Bundle size budget** in `.github/workflows/ci.yml`. To capture a tighter baseline after a clean production build:

```bash
pnpm run build
pnpm run size
```

If the current build is well under the aggregate limit, lower it in `package.json` `"size-limit"` and update this table. Heavy chart code must stay out of the insights _route_ file (lazy `InsightsPanel`).
