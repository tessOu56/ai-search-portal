/**
 * Stateless MCP gateway spike contracts (2026-style _meta per request).
 */

import { z } from "zod";

export const mcpClientMetaSchema = z.object({
  protocolVersion: z.string(),
  clientInfo: z.object({
    name: z.string(),
    version: z.string(),
  }),
  capabilities: z.record(z.string(), z.unknown()).optional(),
});

export const mcpToolNameSchema = z.enum([
  "metadata.search",
  "metadata.get",
  "metadata.lineage",
  "policy.evaluate",
]);

export const mcpToolsCallRequestSchema = z.object({
  method: z.literal("tools/call"),
  params: z.object({
    name: mcpToolNameSchema,
    arguments: z.record(z.string(), z.unknown()),
  }),
  _meta: mcpClientMetaSchema,
});

export const mcpToolsCallResponseSchema = z.object({
  result: z.unknown().optional(),
  taskId: z.string().optional(),
  error: z.string().optional(),
});

export const mcpDiscoverSchema = z.object({
  protocolVersion: z.string(),
  serverInfo: z.object({
    name: z.string(),
    version: z.string(),
  }),
  tools: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
  ttlMs: z.number().int().positive(),
});

export const mcpTaskEventSchema = z.object({
  taskId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  progress: z.number().min(0).max(100).optional(),
  result: z.unknown().optional(),
});
