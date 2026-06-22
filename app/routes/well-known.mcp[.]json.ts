import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { getMcpDiscover } from "~/services/mcp-gateway.server";

export function loader(_args: LoaderFunctionArgs) {
  return json(getMcpDiscover());
}
