#!/usr/bin/env node
/**
 * Figma MCP server (read-only).
 * Tools: get_file, get_variables, get_component_spec.
 * Env: FIGMA_ACCESS_TOKEN (required), FIGMA_FILE_KEY (optional default file).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const FIGMA_API = "https://api.figma.com/v1";

function getToken() {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "FIGMA_ACCESS_TOKEN is required. Set it in environment or in Cursor MCP server config."
    );
  }
  return token;
}

function getDefaultFileKey() {
  return process.env.FIGMA_FILE_KEY ?? null;
}

async function figmaFetch(path, token) {
  const url = `${FIGMA_API}${path}`;
  const res = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

const server = new McpServer({
  name: "figma-mcp",
  version: "1.0.0",
});

// --- get_file ---
server.registerTool(
  "get_file",
  {
    title: "Get Figma file",
    description:
      "Returns file metadata and document tree summary for a Figma file. Use file_key from URL: https://www.figma.com/.../file_key/...",
    inputSchema: {
      file_key: z
        .string()
        .optional()
        .describe(
          "Figma file key (from URL). Omit to use FIGMA_FILE_KEY env."
        ),
    },
  },
  async ({ file_key: fileKey }) => {
    const key = fileKey ?? getDefaultFileKey();
    if (!key) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Missing file_key. Pass file_key or set FIGMA_FILE_KEY.",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
    try {
      const token = getToken();
      const data = await figmaFetch(`/files/${key}?depth=2`, token);
      const summary = {
        name: data.name,
        lastModified: data.lastModified,
        version: data.version,
        role: data.role,
        document: data.document
          ? {
              id: data.document.id,
              name: data.document.name,
              type: data.document.type,
              children: (data.document.children || []).map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
              })),
            }
          : undefined,
        components: data.components
          ? Object.keys(data.components).length
          : 0,
        componentSets: data.componentSets
          ? Object.keys(data.componentSets).length
          : 0,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: err.message,
              hint: "Check FIGMA_ACCESS_TOKEN and file key (from Figma file URL).",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// --- get_variables ---
server.registerTool(
  "get_variables",
  {
    title: "Get Figma local variables",
    description:
      "Returns local variables (and collections) for a file. Requires file_variables:read scope; may be restricted to Enterprise. Use file_key or FIGMA_FILE_KEY.",
    inputSchema: {
      file_key: z
        .string()
        .optional()
        .describe(
          "Figma file key. Omit to use FIGMA_FILE_KEY env."
        ),
    },
  },
  async ({ file_key: fileKey }) => {
    const key = fileKey ?? getDefaultFileKey();
    if (!key) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Missing file_key. Pass file_key or set FIGMA_FILE_KEY.",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
    try {
      const token = getToken();
      const data = await figmaFetch(`/files/${key}/variables/local`, token);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                variables: data.variables ?? {},
                variableCollections: data.variableCollections ?? {},
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: err.message,
              hint: "Variables API may require file_variables:read scope or Enterprise. Use get_file for file structure.",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// --- get_component_spec ---
server.registerTool(
  "get_component_spec",
  {
    title: "Get Figma component spec",
    description:
      "Returns component metadata and style summary for a node. Use node_id from Figma URL ?node-id=ID (replace - with :).",
    inputSchema: {
      file_key: z
        .string()
        .optional()
        .describe("Figma file key. Omit to use FIGMA_FILE_KEY env."),
      node_id: z
        .string()
        .describe(
          "Node ID (e.g. 1:2). From URL: ...?node-id=1-2 → use 1:2"
        ),
    },
  },
  async ({ file_key: fileKey, node_id: nodeId }) => {
    const key = fileKey ?? getDefaultFileKey();
    if (!key) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Missing file_key. Pass file_key or set FIGMA_FILE_KEY.",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
    const normalizedId = nodeId.replace(/-/g, ":");
    try {
      const token = getToken();
      const data = await figmaFetch(
        `/files/${key}/nodes?ids=${encodeURIComponent(normalizedId)}`,
        token
      );
      const nodes = data.nodes;
      if (!nodes || !nodes[normalizedId]) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Node not found",
                node_id: normalizedId,
                file_key: key,
              }),
            },
          ],
          isError: true,
        };
      }
      const node = nodes[normalizedId];
      const doc = node.document;
      const spec = {
        id: doc?.id,
        name: doc?.name,
        type: doc?.type,
        description: doc?.description ?? null,
        ...(doc?.absoluteBoundingBox && {
          width: doc.absoluteBoundingBox.width,
          height: doc.absoluteBoundingBox.height,
        }),
        ...(doc?.fills && { fills: doc.fills }),
        ...(doc?.strokes && { strokes: doc.strokes }),
        ...(doc?.effects && { effects: doc.effects }),
        componentProperties: doc?.componentProperties ?? undefined,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(spec, null, 2) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: err.message,
              node_id: normalizedId,
              file_key: key,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
