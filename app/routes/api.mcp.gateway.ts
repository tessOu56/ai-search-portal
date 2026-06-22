import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { handleMcpToolsCall } from "~/services/mcp-gateway.server";
import { mcpToolsCallResponseSchema } from "~/shared/contracts";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const result = handleMcpToolsCall(raw);
  const body = mcpToolsCallResponseSchema.parse(result);
  return json(body);
}
