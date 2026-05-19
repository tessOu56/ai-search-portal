import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const flowsPath = join(here, "..", "fixtures", "api-explorer-flows.json");

type Flow = {
  id: string;
  title: string;
  screens: string[];
  portalTargets: string[];
};

async function main(): Promise<void> {
  const raw = await readFile(flowsPath, "utf8");
  const doc = JSON.parse(raw) as { flows: Flow[] };

  console.log(`# Design vibe session (Figma MCP + portal)

## Prerequisites

1. Enable MCP server: \`tools/figma-mcp\` (see tools/figma-mcp/README.md)
2. Set FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY in Cursor MCP settings
3. Read flows fixture: labs/design-vibe/fixtures/api-explorer-flows.json

## Task

For each flow below:
- Use Figma tools: get_file, get_component_spec (and get_variables if available)
- Map screens → portal component paths
- Output a gap table: { flow, figma node, portal path, action }

## Flows

`);

  for (const f of doc.flows) {
    console.log(`### ${f.title} (\`${f.id}\`)`);
    console.log(`- Screens: ${f.screens.join(", ")}`);
    console.log(`- Portal targets: ${f.portalTargets.join(", ")}`);
    console.log("");
  }

  console.log(`## Deliverables

- Update labs/design-vibe/GAP-REPORT.md
- Optional: design tokens draft under docs/DESIGN_SYSTEM.md
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
