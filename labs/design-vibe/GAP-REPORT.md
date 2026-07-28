# Design vibe — gap report

Reference: `fixtures/api-explorer-flows.json` (Downloads API Explorer) → **ai-search-portal** + Figma MCP.

| Flow               | Reference screens                        | Portal target                                      | Figma node (MCP)                      | Priority | Gap / next action                                                |
| ------------------ | ---------------------------------------- | -------------------------------------------------- | ------------------------------------- | -------- | ---------------------------------------------------------------- |
| **catalog-search** | search home, filters, results, API row   | `app/features/catalogsearch`, `CatalogSearchPanel` | **waiver** until Figma MCP (STOP-003) | P0       | ✅ URL type filter + pagination on mock; Access filters deferred |
| **api-detail**     | endpoint list, request builder, response | `/metadata/:assetId` data-contract + apply (G1)    | waiver (STOP-003)                     | P0       | ✅ owner／PII／terms＋apply；三欄 explorer 仍可後補              |
| **my-apis**        | my assets grid, card → API               | `/my-apis` + `/access-requests/review`             | waiver (STOP-003)                     | P1       | ✅ G1 mock cards + session role；Figma card polish later         |
| **requests**       | request list, status, replay             | _Not in v1_                                        | `n/a`                                 | P2       | Spec-only or defer                                               |

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
- [ ] At least one flow with Figma node IDs filled (blocked: external Figma token — see `docs/STOP-EXTERNAL.md`)
- [x] One PR touching portal UI from gap row P0 (`/catalog-search` shell + filter/pagination)
