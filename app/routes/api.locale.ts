import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { localeCookie } from "~/shared/i18n";
import { safeInternalRedirectPath } from "~/shared/utils/safe-url";

const SUPPORTED = ["zh-TW", "en"] as const;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return redirect("/");
  }
  const form = await request.formData();
  const locale = form.get("locale");
  const nextRaw = form.get("next");
  const nextUrl =
    typeof nextRaw === "string" ? nextRaw : request.headers.get("Referer");
  const path = safeInternalRedirectPath(nextUrl, new URL(request.url).origin);

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
