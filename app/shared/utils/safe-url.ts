/**
 * Same-origin redirect / href guards.
 * Rejects protocol-relative, javascript:, data:, and backslash open-redirect tricks.
 */

const FALLBACK_PATH = "/";
const DUMMY_ORIGIN = "https://portal.invalid";

export type SafeHrefKind = "internal" | "external" | "unsafe";

function isHttpProtocol(protocol: string): boolean {
  return protocol === "http:" || protocol === "https:";
}

function hasUnsafeChars(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code <= 31 || code === 127 || char === "\\") return true;
  }
  return false;
}

function toAppPath(url: URL): string | null {
  const path = `${url.pathname}${url.search}${url.hash}`;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

function parseRelativeAppPath(candidate: string): string | null {
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return null;
  try {
    const url = new URL(candidate, DUMMY_ORIGIN);
    if (url.origin !== DUMMY_ORIGIN) return null;
    return toAppPath(url);
  } catch {
    return null;
  }
}

/**
 * Keep only an in-app path for Location / cookie-setting redirects.
 * Absolute URLs are allowed only when they match `allowedOrigin` (e.g. Referer).
 */
export function safeInternalRedirectPath(
  raw: string | null | undefined,
  allowedOrigin?: string
): string {
  if (typeof raw !== "string") return FALLBACK_PATH;
  const candidate = raw.trim();
  if (!candidate || hasUnsafeChars(candidate)) return FALLBACK_PATH;

  const relative = parseRelativeAppPath(candidate);
  if (relative) return relative;

  try {
    const url = new URL(candidate);
    if (!isHttpProtocol(url.protocol)) return FALLBACK_PATH;
    if (allowedOrigin && url.origin === allowedOrigin) {
      return toAppPath(url) ?? FALLBACK_PATH;
    }
    return FALLBACK_PATH;
  } catch {
    return FALLBACK_PATH;
  }
}

/** Classify LUI source / next-action hrefs before rendering as links. */
export function classifySafeHref(href: string): SafeHrefKind {
  const trimmed = href.trim();
  if (!trimmed || hasUnsafeChars(trimmed)) return "unsafe";

  if (parseRelativeAppPath(trimmed)) return "internal";

  try {
    const url = new URL(trimmed);
    return isHttpProtocol(url.protocol) ? "external" : "unsafe";
  } catch {
    return "unsafe";
  }
}
