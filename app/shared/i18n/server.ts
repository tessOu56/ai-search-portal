import { readFileSync } from "node:fs";
import path from "node:path";

import { createCookie } from "@remix-run/node";

const LOCALE_COOKIE = "locale";
const DEFAULT_LOCALE = "zh-TW";
const SUPPORTED_LOCALES = ["zh-TW", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const localeCookie = createCookie(LOCALE_COOKIE, {
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
});

type RequestLike = { headers: { get(name: string): string | null } };

export async function getLocale(request: RequestLike): Promise<Locale> {
  const cookieHeader = request.headers.get("Cookie");
  const cookie: unknown = await localeCookie.parse(cookieHeader);
  if (
    typeof cookie === "string" &&
    SUPPORTED_LOCALES.includes(cookie as Locale)
  ) {
    return cookie as Locale;
  }
  const accept = request.headers.get("Accept-Language") ?? "";
  if (accept.includes("en")) return "en";
  return DEFAULT_LOCALE;
}

type Translations = Record<string, string>;

function loadTranslations(locale: Locale): Translations {
  const base = path.join(process.cwd(), "app/shared/i18n/translations");
  const file = path.join(base, `${locale}.json`);
  try {
    const raw = readFileSync(file, "utf-8");
    return JSON.parse(raw) as Translations;
  } catch {
    return {};
  }
}

export function getTranslations(locale: Locale): Translations {
  return loadTranslations(locale);
}

export function t(
  translations: Translations,
  key: string,
  vars?: Record<string, string>
): string {
  let value = translations[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return value;
}
