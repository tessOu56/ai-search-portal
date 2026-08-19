import { PanelLeft } from "lucide-react";
import { type ReactNode, useState } from "react";

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

  return (
    <div className="flex min-h-dvh flex-col">
      <WorkspaceTopbar
        trailingStart={
          mode === "overview" ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="md:hidden"
              aria-expanded={directoryOpen}
              aria-controls="overview-directory"
              aria-label={t("nav.directory")}
              onClick={() => setDirectoryOpen((open) => !open)}
            >
              <PanelLeft className="size-4" aria-hidden />
            </Button>
          ) : null
        }
      />
      {mode === "overview" ? (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <OverviewDirectory
            mobileOpen={directoryOpen}
            onNavigate={() => setDirectoryOpen(false)}
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
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
