import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { CONTEXT_PACK_COOKIE } from "~/services/context-pack.server";
import { safeInternalRedirectPath } from "~/shared/utils/safe-url";

const PACK_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const packId = form.get("packId");
  if (typeof packId !== "string" || !packId.trim()) {
    throw new Response("Missing packId", { status: 400 });
  }
  const redirectTo = form.get("redirectTo");
  const requestedPath = safeInternalRedirectPath(
    typeof redirectTo === "string" ? redirectTo : null
  );
  const onMetadata =
    requestedPath === "/metadata" ||
    requestedPath.startsWith("/metadata/") ||
    requestedPath.startsWith("/metadata?") ||
    requestedPath.startsWith("/metadata#");
  const safeRedirect = onMetadata ? requestedPath : "/metadata";

  const url = new URL(safeRedirect, "https://portal.invalid");
  url.searchParams.set("pack", packId.trim());

  return redirect(`${url.pathname}${url.search}`, {
    headers: {
      "Set-Cookie": `${CONTEXT_PACK_COOKIE}=${encodeURIComponent(packId.trim())}; Path=/; Max-Age=${PACK_COOKIE_MAX_AGE}; SameSite=Lax`,
    },
  });
}
