import { PanelLeft } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { Button } from "~/components/ui/Button";
import { useI18n } from "~/shared/i18n/context";

import { OverviewDirectory } from "./OverviewDirectory";
import {
  useWorkspaceSession,
  WorkspaceSessionProvider,
} from "./WorkspaceSession";
import { WorkspaceTopbar } from "./WorkspaceTopbar";

function AppChromeFrame({ children }: { children: ReactNode }) {
  const { mode } = useWorkspaceSession();
  const { t } = useI18n();
  const [directoryOpen, setDirectoryOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (media.matches) setDirectoryOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <WorkspaceTopbar
        trailingStart={
          mode === "overview" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-space-8 md:hidden"
              aria-expanded={directoryOpen}
              aria-controls="overview-directory"
              onClick={() => setDirectoryOpen((open) => !open)}
            >
              <PanelLeft className="size-4" aria-hidden />
              {t("nav.directory")}
            </Button>
          ) : null
        }
      />
      {mode === "overview" ? (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row md:items-stretch">
          <OverviewDirectory
            mobileOpen={directoryOpen}
            onNavigate={() => setDirectoryOpen(false)}
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background">
            {children}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <WorkspaceSessionProvider>
      <AppChromeFrame>{children}</AppChromeFrame>
    </WorkspaceSessionProvider>
  );
}
