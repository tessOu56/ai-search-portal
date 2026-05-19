# Design vibe — gap report

Reference: `fixtures/api-explorer-flows.json` (Downloads API Explorer) → **ai-search-portal** + Figma MCP.

| Flow               | Reference screens                        | Portal target                                       | Figma node (MCP)                     | Priority | Gap / next action                                             |
| ------------------ | ---------------------------------------- | --------------------------------------------------- | ------------------------------------ | -------- | ------------------------------------------------------------- |
| **catalog-search** | search home, filters, results, API row   | `app/features/catalog-search`, `CatalogSearchPanel` | `TBD` — run `pnpm run design:prompt` | P0       | Align toolbar/pagination; fill node after `get_file`          |
| **api-detail**     | endpoint list, request builder, response | Catalog API detail, `ThreeColumnExplorerLayout`     | `TBD`                                | P0       | Map request/response panels; see `docs/product/lui-search.md` |
| **my-apis**        | my assets grid, card → API               | My Work Center `/my-apis`                           | `TBD`                                | P1       | Card pattern from `view-myassets`                             |
| **requests**       | request list, status, replay             | _Not in v1_                                         | `n/a`                                | P2       | Spec-only or defer                                            |

## Component mapping (initial)

| Explorer concept          | Portal component / doc                                |
| ------------------------- | ----------------------------------------------------- |
| Combined search + filters | `CatalogSearchPanel`, `CombinedFilters`               |
| Results table row         | Catalog API row (chevron + ITEM column)               |
| API detail tabs           | API detail flat layout (endpoint / Request summaries) |
| My assets card            | My APIs page cards (planned)                          |

## Figma MCP session

```bash
pnpm run design:prompt
```

1. Set `FIGMA_ACCESS_TOKEN` + `FIGMA_FILE_KEY` in Cursor MCP.
2. For each flow, call `get_file` / `get_component_spec`.
3. Update **Figma node** column above.

## Done criteria (lab-design-vibe)

- [x] Fixture SSOT for four flows
- [x] Initial GAP table with portal paths
- [ ] At least one flow with Figma node IDs filled (column ready; needs `FIGMA_*` MCP)
- [ ] One PR touching portal UI from gap row P0
