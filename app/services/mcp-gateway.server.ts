import { randomUUID } from "node:crypto";

import {
  mcpDiscoverSchema,
  mcpToolsCallRequestSchema,
} from "@ai-search-portal/contracts";
import type { z } from "zod";

import { evaluateMetadataAccess } from "~/services/access-policy.server";
import {
  getMetadataAsset,
  listMetadataAssets,
  resolveMetadataLineage,
} from "~/services/metadata.server";

const LINEAGE_TASK_THRESHOLD = 6;
const ERROR_ASSET_NOT_FOUND = "Asset not found";

type McpTask = {
  taskId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  result?: unknown;
};

const tasks = new Map<string, McpTask>();

export function getMcpDiscover() {
  return mcpDiscoverSchema.parse({
    protocolVersion: "2026-07-28-rc1",
    serverInfo: {
      name: "ai-search-portal-mcp",
      version: "0.1.0",
    },
    tools: [
      {
        name: "metadata.search",
        description: "Search metadata catalog assets",
      },
      { name: "metadata.get", description: "Get metadata asset by id" },
      { name: "metadata.lineage", description: "Resolve asset lineage graph" },
      {
        name: "policy.evaluate",
        description: "Evaluate access policy for an asset",
      },
    ],
    ttlMs: 60_000,
  });
}

export function handleMcpToolsCall(body: unknown): {
  result?: unknown;
  taskId?: string;
  error?: string;
} {
  const parsed = mcpToolsCallRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { error: "Invalid MCP tools/call request" };
  }

  const req = parsed.data;
  switch (req.params.name) {
    case "metadata.search":
      return handleMetadataSearch(req);
    case "metadata.get":
      return handleMetadataGet(req);
    case "metadata.lineage":
      return handleMetadataLineage(req);
    case "policy.evaluate":
      return handlePolicyEvaluate(req);
    default:
      return { error: "Unknown tool" };
  }
}

type McpToolsCallRequest = z.infer<typeof mcpToolsCallRequestSchema>;

function handleMetadataSearch(req: McpToolsCallRequest) {
  const args = req.params.arguments as {
    q?: string;
    type?: string;
    page?: number;
  };
  const result = listMetadataAssets({
    q: typeof args.q === "string" ? args.q : "",
    type: typeof args.type === "string" ? args.type : undefined,
    page: typeof args.page === "number" ? args.page : 1,
  });
  return { result };
}

function handleMetadataGet(req: McpToolsCallRequest) {
  const args = req.params.arguments as { assetId?: string };
  const assetId = args.assetId;
  if (!assetId) return { error: "assetId required" };
  const asset = getMetadataAsset(assetId);
  if (!asset) return { error: ERROR_ASSET_NOT_FOUND };
  return { result: asset };
}

function handleMetadataLineage(req: McpToolsCallRequest) {
  const args = req.params.arguments as { assetId?: string };
  const assetId = args.assetId;
  if (!assetId) return { error: "assetId required" };
  const lineage = resolveMetadataLineage(assetId);
  if (!lineage) return { error: ERROR_ASSET_NOT_FOUND };

  if (lineage.nodes.length >= LINEAGE_TASK_THRESHOLD) {
    const taskId = randomUUID();
    tasks.set(taskId, { taskId, status: "pending", progress: 0 });
    queueMicrotask(() => {
      const task = tasks.get(taskId);
      if (!task) return;
      task.status = "running";
      task.progress = 50;
      task.status = "completed";
      task.progress = 100;
      task.result = lineage;
    });
    return { taskId };
  }

  return { result: lineage };
}

function handlePolicyEvaluate(req: McpToolsCallRequest) {
  const args = req.params.arguments as {
    assetId?: string;
    purpose?: "analytics" | "marketing" | "operations";
    role?: "analyst" | "data_admin" | "engineer";
  };
  if (!args.assetId || !args.purpose) {
    return { error: "assetId and purpose required" };
  }
  try {
    const decision = evaluateMetadataAccess({
      assetId: args.assetId,
      purpose: args.purpose,
      role: args.role,
    });
    return { result: decision };
  } catch {
    return { error: ERROR_ASSET_NOT_FOUND };
  }
}

export function getMcpTask(taskId: string): McpTask | null {
  return tasks.get(taskId) ?? null;
}

export function resetMcpTasks(): void {
  tasks.clear();
}
