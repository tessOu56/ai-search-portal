# Figma MCP Server (read-only)

MCP server that exposes Figma file data to Cursor via read-only tools. See [docs/architecture/figma-mcp.md](../../docs/architecture/figma-mcp.md) for architecture and boundaries.

## Tools

| Tool                 | Description                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `get_file`           | File metadata and document tree summary (depth 2).                                        |
| `get_variables`      | Local variables and collections (requires `file_variables:read`; may be Enterprise-only). |
| `get_component_spec` | Component/node spec by node ID (bounds, fills, componentProperties).                      |

## Setup

1. **Install dependencies** (from repo root or this folder):

   ```bash
   npm install
   ```

   (From repo root, run from `tools/figma-mcp`: `cd tools/figma-mcp && npm install`.)

2. **Figma access token**
   - Create a [personal access token](https://www.figma.com/developers/api#access-tokens) in Figma (Settings → Account → Personal access tokens).
   - Scopes: at least `file_content:read`. For `get_variables`, add `file_variables:read` (if available for your org).

3. **Cursor MCP config**
   - Open Cursor **Settings → Tools & MCP** (or edit `.cursor/mcp.json` in the project).
   - For the `figma` server, set:
     - `FIGMA_ACCESS_TOKEN`: your Figma personal access token (required).
     - `FIGMA_FILE_KEY`: default file key (optional). You can also pass `file_key` in each tool call.
   - **Do not commit** real tokens to git. Use Cursor’s env UI or a local override.

4. **File key**
   - From a Figma file URL: `https://www.figma.com/design/<FILE_KEY>/...` or `.../file/<FILE_KEY>/...`.
   - Copy the `FILE_KEY` segment into `FIGMA_FILE_KEY` or pass it as `file_key` to the tools.

## Run locally (optional)

```bash
cd tools/figma-mcp
FIGMA_ACCESS_TOKEN=your_token FIGMA_FILE_KEY=optional_default node server.mjs
```

The server uses stdio; Cursor spawns it automatically when the MCP server is enabled.
