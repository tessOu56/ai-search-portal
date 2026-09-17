import type { LoaderFunctionArgs } from "react-router";

import { getMcpDiscover } from "~/services/mcp-gateway.server";

export function loader(_args: LoaderFunctionArgs) {
  return Response.json(getMcpDiscover());
}
