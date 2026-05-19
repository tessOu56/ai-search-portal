# lab-design-vibe

Bridges **Downloads API Explorer** UI flows (design reference) → **Figma MCP** → **ai-search-portal** components.

## Not in scope

- Copying static HTML into the product repo
- Replacing `tools/figma-mcp` (this lab consumes it)

## Workflow

1. Edit `fixtures/api-explorer-flows.json` when reference UX changes
2. `pnpm --filter @ai-search-portal/lab-design-vibe run prompt` → paste into Cursor
3. Update `GAP-REPORT.md` after Figma session
4. Sync summary to `ai-dev-studio/chronicle/2026/labs/figma-mcp-design.md`

## Related

- `docs/architecture/figma-mcp.md`
- `develop-md/projects/downloads-api/`
