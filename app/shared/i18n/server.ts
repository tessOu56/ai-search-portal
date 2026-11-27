import { createCookie } from "react-router";

const LOCALE_COOKIE = "locale";
const DEFAULT_LOCALE = "zh-TW";
const SUPPORTED_LOCALES = ["zh-TW", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const localeCookie = createCookie(LOCALE_COOKIE, {
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: import.meta.env.PROD,
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

const TRANSLATION_MODULES = (
  import.meta as ImportMeta & {
    glob: (
      pattern: string,
      options: { eager: boolean; import: string }
    ) => Record<string, unknown>;
  }
).glob("./translations/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Translations>;

function localeFromKey(key: string): Locale | null {
  const match = /\/([a-z]{2}-[A-Z]{2})\.json$/.exec(key);
  if (!match?.[1]) return null;
  const code = match[1];
  return SUPPORTED_LOCALES.includes(code as Locale) ? (code as Locale) : null;
}

function loadTranslations(locale: Locale): Translations {
  for (const [key, mod] of Object.entries(TRANSLATION_MODULES)) {
    if (localeFromKey(key) === locale) {
      return mod;
    }
  }
  return {};
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
