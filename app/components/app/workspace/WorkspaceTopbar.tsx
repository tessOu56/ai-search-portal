import { Link, useLocation, useSearchParams } from "@remix-run/react";
import type { ReactNode } from "react";

import { BrandMark } from "~/components/ui/BrandMark";
import {
  brandHref,
  emitAskHomeReset,
  workspaceModeFromLocation,
} from "~/lib/workspace-mode";
import { useI18n } from "~/shared/i18n/context";
import { cn } from "~/shared/utils/cn";

import { WorkspaceViewSwitcher } from "./WorkspaceViewSwitcher";

type WorkspaceTopbarProps = {
  trailingStart?: ReactNode;
  trailing?: ReactNode;
  onBrandClick?: () => void;
  className?: string;
};

export function WorkspaceTopbar({
  trailingStart,
  trailing,
  onBrandClick,
  className,
}: WorkspaceTopbarProps) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const mode = workspaceModeFromLocation(pathname, searchParams);
  const to = brandHref(mode);
  const title = t("app.title");

  return (
    <header
      data-testid="workspace-topbar"
      className={cn(
        "bg-background/90 sticky top-0 z-20 shrink-0 border-b border-border backdrop-blur-md",
        className
      )}
    >
      <div className="flex h-12 w-full flex-nowrap items-center justify-between gap-space-8 px-space-16 md:px-space-32">
        <Link
          to={to}
          onClick={() => {
            if (mode === "ask") emitAskHomeReset();
            onBrandClick?.();
          }}
          className="flex min-w-0 shrink items-center text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={title}
        >
          <BrandMark
            size="sm"
            lockup="mark"
            className="text-foreground md:hidden"
          />
          <BrandMark
            size="sm"
            lockup="horizontal"
            wordmark={title}
            className="hidden text-foreground md:inline-flex"
          />
        </Link>
        <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1">
          {trailingStart}
          {trailing}
          <WorkspaceViewSwitcher />
        </div>
      </div>
    </header>
  );
}
