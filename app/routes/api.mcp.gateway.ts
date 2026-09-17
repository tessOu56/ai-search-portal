import type { ActionFunctionArgs } from "react-router";

import { handleMcpToolsCall } from "~/services/mcp-gateway.server";
import { mcpToolsCallResponseSchema } from "~/shared/contracts";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const result = handleMcpToolsCall(raw);
  const body = mcpToolsCallResponseSchema.parse(result);
  return Response.json(body);
}
