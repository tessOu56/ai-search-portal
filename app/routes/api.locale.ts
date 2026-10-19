import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { localeCookie } from "~/shared/i18n";

const SUPPORTED = ["zh-TW", "en"] as const;

function safeNextPath(raw: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/";
  }
  return raw;
}

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
  let path = "/";
  if (nextUrl.startsWith("/")) {
    path = safeNextPath(nextUrl);
  } else {
    try {
      const parsed = new URL(nextUrl);
      path = safeNextPath(`${parsed.pathname}${parsed.search}`);
    } catch {
      path = "/";
    }
  }

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
