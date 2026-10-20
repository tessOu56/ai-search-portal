import { randomUUID } from "node:crypto";

import {
  MCP_TOOL_METADATA,
  mcpDiscoverSchema,
  mcpToolsCallRequestSchema,
  parseMcpToolArguments,
  type Principal,
} from "@ai-search-portal/contracts";
import type { z } from "zod";

import { evaluateMetadataAccess } from "~/services/access-policy.server";
import { verifyHitlConfirmToken } from "~/services/auth.server";
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
    // 階段二收尾：discover 由 MCP_TOOL_METADATA 生成，附風險註記（單一 SoT）
    tools: Object.values(MCP_TOOL_METADATA).map((meta) => ({
      name: meta.name,
      description: meta.description,
      riskLevel: meta.riskLevel,
      requiresHitl: meta.requiresHitl,
    })),
    ttlMs: 60_000,
  });
}

export type McpCallResult = {
  status: number;
  body: {
    result?: unknown;
    taskId?: string;
    error?: string;
    code?: string;
  };
};

export function handleMcpToolsCall(
  body: unknown,
  context: { user: Principal }
): McpCallResult {
  const parsed = mcpToolsCallRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { error: "Invalid MCP tools/call request" } };
  }

  const req = parsed.data;
  const meta = MCP_TOOL_METADATA[req.params.name];
  if (meta.requiresHitl) {
    const token = req._meta.hitlConfirmToken;
    if (!verifyHitlConfirmToken(token, context.user, req.params.name)) {
      return {
        status: 403,
        body: {
          error: "Human confirmation required before executing this tool",
          code: "HITL_REQUIRED",
        },
      };
    }
  }

  switch (req.params.name) {
    case "metadata.search":
      return wrapMcp(handleMetadataSearch(req));
    case "metadata.get":
      return wrapMcp(handleMetadataGet(req));
    case "metadata.lineage":
      return wrapMcp(handleMetadataLineage(req));
    case "policy.evaluate":
      return wrapMcp(handlePolicyEvaluate(req, context.user));
    default:
      return { status: 400, body: { error: "Unknown tool" } };
  }
}

function wrapMcp(body: {
  result?: unknown;
  taskId?: string;
  error?: string;
}): McpCallResult {
  return { status: 200, body };
}

type McpToolsCallRequest = z.infer<typeof mcpToolsCallRequestSchema>;

function handleMetadataSearch(req: McpToolsCallRequest) {
  const parsed = parseMcpToolArguments("metadata.search", req.params.arguments);
  if (!parsed.ok) return { error: parsed.error };
  const args = parsed.data as { q?: string; type?: string; page?: number };
  const result = listMetadataAssets({
    q: args.q ?? "",
    type: args.type,
    page: args.page ?? 1,
  });
  return { result };
}

function handleMetadataGet(req: McpToolsCallRequest) {
  const parsed = parseMcpToolArguments("metadata.get", req.params.arguments);
  if (!parsed.ok) return { error: "assetId required" };
  const { assetId } = parsed.data as { assetId: string };
  const asset = getMetadataAsset(assetId);
  if (!asset) return { error: ERROR_ASSET_NOT_FOUND };
  return { result: asset };
}

function handleMetadataLineage(req: McpToolsCallRequest) {
  const parsed = parseMcpToolArguments(
    "metadata.lineage",
    req.params.arguments
  );
  if (!parsed.ok) return { error: "assetId required" };
  const { assetId } = parsed.data as { assetId: string };
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

function handlePolicyEvaluate(req: McpToolsCallRequest, user: Principal) {
  const parsed = parseMcpToolArguments("policy.evaluate", req.params.arguments);
  if (!parsed.ok) return { error: "assetId and purpose required" };
  const args = parsed.data as {
    assetId: string;
    purpose: "analytics" | "marketing" | "operations";
  };
  try {
    const decision = evaluateMetadataAccess({
      assetId: args.assetId,
      purpose: args.purpose,
      role: user.opaRole,
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
