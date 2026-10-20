import type { ActionFunctionArgs } from "react-router";

import { handleMcpToolsCall } from "~/services/mcp-gateway.server";
import {
  jsonBodyErrorResponse,
  readJsonBody,
} from "~/services/request-body.server";
import {
  rejectIfRateLimited,
  requirePrincipal,
} from "~/services/route-guard.server";
import { mcpToolsCallResponseSchema } from "~/shared/contracts";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const limited = rejectIfRateLimited(request, "mcp");
  if (limited) return limited;

  const auth = requirePrincipal(request);
  if ("response" in auth) return auth.response;

  const raw = await readJsonBody(request);
  if (!raw.ok) return jsonBodyErrorResponse(raw);

  const result = handleMcpToolsCall(raw.value, { user: auth.user });
  const parsed = mcpToolsCallResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid MCP tools/call response" },
      { status: 500 }
    );
  }
  return Response.json(parsed.data, { status: result.status });
}
