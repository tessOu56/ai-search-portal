# Bundle size budget (T-2026-059)

Gate: `pnpm run size` (size-limit) after `pnpm run build`.

| Path                       | Limit           | Notes                                                                                    |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| `build/client/assets/*.js` | **900 kB** gzip | Initial Gate 1 baseline — fails if roughly doubled from a healthy Remix client chunk set |

Evidence: CI job **Bundle size budget** in `.github/workflows/ci.yml`. To capture a tighter baseline after a clean production build:

```bash
pnpm run build
pnpm run size
```

If the current build is well under 900 kB, lower the limit in `package.json` `"size-limit"` and update this table.
