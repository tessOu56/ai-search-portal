import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { CONTEXT_PACK_COOKIE } from "~/services/context-pack.server";

const PACK_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const packId = form.get("packId");
  if (typeof packId !== "string" || !packId.trim()) {
    throw new Response("Missing packId", { status: 400 });
  }
  const redirectTo = form.get("redirectTo");
  const safeRedirect =
    typeof redirectTo === "string" && redirectTo.startsWith("/metadata")
      ? redirectTo
      : "/metadata";

  const url = new URL(safeRedirect, "http://localhost");
  url.searchParams.set("pack", packId.trim());

  return redirect(`${url.pathname}${url.search}`, {
    headers: {
      "Set-Cookie": `${CONTEXT_PACK_COOKIE}=${encodeURIComponent(packId.trim())}; Path=/; Max-Age=${PACK_COOKIE_MAX_AGE}; SameSite=Lax`,
    },
  });
}
