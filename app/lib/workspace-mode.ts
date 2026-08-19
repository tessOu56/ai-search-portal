export const ASK_HOME = "/";
export const OVERVIEW_HOME = "/?view=dashboard";
export const LAST_OVERVIEW_STORAGE_KEY = "portal-last-overview";
export const ASK_HOME_RESET_EVENT = "portal:ask-home-reset";

export type WorkspaceMode = "ask" | "overview";

export type SearchParamsLike = {
  get: (key: string) => string | null;
};

export function workspaceModeFromLocation(
  pathname: string,
  searchParams: SearchParamsLike
): WorkspaceMode {
  if (pathname !== "/") return "overview";
  const view = searchParams.get("view");
  if (view === "dashboard" || view === "saas") return "overview";
  return "ask";
}

export function brandHref(mode: WorkspaceMode): string {
  return mode === "overview" ? OVERVIEW_HOME : ASK_HOME;
}

export function serializeOverviewHref(
  pathname: string,
  search: string
): string {
  if (pathname === "/") return OVERVIEW_HOME;
  return `${pathname}${search}`;
}

export function parseStoredOverviewPath(raw: string | null): string {
  if (!raw) return OVERVIEW_HOME;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return OVERVIEW_HOME;
  }
  try {
    const url = new URL(raw, "http://portal.local");
    if (url.pathname === "/") {
      const view = url.searchParams.get("view");
      if (view === "dashboard" || view === "saas") return OVERVIEW_HOME;
      return OVERVIEW_HOME;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return OVERVIEW_HOME;
  }
}

export function readLastOverviewPath(): string {
  if (typeof sessionStorage === "undefined") return OVERVIEW_HOME;
  try {
    return parseStoredOverviewPath(
      sessionStorage.getItem(LAST_OVERVIEW_STORAGE_KEY)
    );
  } catch {
    return OVERVIEW_HOME;
  }
}

export function writeLastOverviewPath(pathname: string, search: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      LAST_OVERVIEW_STORAGE_KEY,
      parseStoredOverviewPath(serializeOverviewHref(pathname, search))
    );
  } catch {
    // Private mode / quota — keep navigating without memory.
  }
}

export function rememberOverviewLocation(
  pathname: string,
  search: string,
  searchParams: SearchParamsLike
): void {
  if (workspaceModeFromLocation(pathname, searchParams) !== "overview") return;
  writeLastOverviewPath(pathname, search);
}

export function nextLastOverviewHref(
  mode: WorkspaceMode,
  pathname: string,
  search: string,
  previous: string
): string {
  if (mode === "overview") {
    return serializeOverviewHref(pathname, search);
  }
  return parseStoredOverviewPath(previous);
}

export function overviewSwitchHref(
  mode: WorkspaceMode,
  pathname: string,
  search: string
): string {
  return nextLastOverviewHref(mode, pathname, search, readLastOverviewPath());
}

export function emitAskHomeReset(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ASK_HOME_RESET_EVENT));
}

export function canGoBackFromHistory(): boolean {
  if (typeof window === "undefined") return false;
  const idx = (window.history.state as { idx?: number } | null | undefined)
    ?.idx;
  if (typeof idx === "number") return idx > 0;
  return window.history.length > 1;
}

export function backFallbackHref(
  crumbs: Array<{ to: string }> | undefined
): string {
  const parent = crumbs?.at(-1)?.to;
  if (!parent || parent === ASK_HOME) return OVERVIEW_HOME;
  return parent;
}
