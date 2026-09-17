import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { localeCookie } from "~/shared/i18n";

const SUPPORTED = ["zh-TW", "en"] as const;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return redirect("/");
  }
  const form = await request.formData();
  const locale = form.get("locale");
  const nextRaw = form.get("next");
  const nextUrl =
    (typeof nextRaw === "string" ? nextRaw : null) ??
    request.headers.get("Referer") ??
    "/";
  const path = nextUrl.startsWith("/")
    ? nextUrl
    : new URL(nextUrl).pathname || "/";

  if (
    typeof locale === "string" &&
    SUPPORTED.includes(locale as (typeof SUPPORTED)[number])
  ) {
    return redirect(path, {
      headers: {
        "Set-Cookie": await localeCookie.serialize(locale),
      },
    });
  }
  return redirect(path);
}
