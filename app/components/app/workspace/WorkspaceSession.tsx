import { useLocation, useSearchParams } from "@remix-run/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  nextLastOverviewHref,
  OVERVIEW_HOME,
  readLastOverviewPath,
  serializeOverviewHref,
  type WorkspaceMode,
  workspaceModeFromLocation,
  writeLastOverviewPath,
} from "~/lib/workspace-mode";

type WorkspaceSessionValue = {
  mode: WorkspaceMode;
  lastOverviewHref: string;
  overviewReturnHref: string;
  rememberCurrentIfOverview: () => void;
};

const WorkspaceSessionContext = createContext<WorkspaceSessionValue | null>(
  null
);

/**
 * Session SSOT for the last Overview location.
 * Survives Ask landing, ?q= entry, and the in-memory conversation shell.
 */
export function WorkspaceSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { pathname, search } = useLocation();
  const [searchParams] = useSearchParams();
  const mode = workspaceModeFromLocation(pathname, searchParams);
  const [lastOverviewHref, setLastOverviewHref] = useState(OVERVIEW_HOME);

  const persistOverview = useCallback(
    (nextPathname: string, nextSearch: string) => {
      const href = serializeOverviewHref(nextPathname, nextSearch);
      setLastOverviewHref(href);
      writeLastOverviewPath(nextPathname, nextSearch);
    },
    []
  );

  useEffect(() => {
    setLastOverviewHref(readLastOverviewPath());
  }, []);

  useEffect(() => {
    if (mode !== "overview") return;
    persistOverview(pathname, search);
  }, [mode, pathname, persistOverview, search]);

  const rememberCurrentIfOverview = useCallback(() => {
    if (mode !== "overview") return;
    persistOverview(pathname, search);
  }, [mode, pathname, persistOverview, search]);

  const overviewReturnHref = nextLastOverviewHref(
    mode,
    pathname,
    search,
    lastOverviewHref
  );

  const value = useMemo(
    () => ({
      mode,
      lastOverviewHref,
      overviewReturnHref,
      rememberCurrentIfOverview,
    }),
    [lastOverviewHref, mode, overviewReturnHref, rememberCurrentIfOverview]
  );

  return (
    <WorkspaceSessionContext.Provider value={value}>
      {children}
    </WorkspaceSessionContext.Provider>
  );
}

export function useWorkspaceSession(): WorkspaceSessionValue {
  const ctx = useContext(WorkspaceSessionContext);
  if (!ctx) {
    throw new Error(
      "useWorkspaceSession must be used within WorkspaceSessionProvider"
    );
  }
  return ctx;
}
