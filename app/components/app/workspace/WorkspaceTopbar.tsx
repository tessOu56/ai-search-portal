import { Link } from "@remix-run/react";
import type { ReactNode } from "react";

import { BrandMark } from "~/components/ui/BrandMark";
import { useI18n } from "~/shared/i18n/context";
import { cn } from "~/shared/utils/cn";

import { WorkspaceViewSwitcher } from "./WorkspaceViewSwitcher";

type WorkspaceTopbarProps = {
  trailing?: ReactNode;
  onBrandClick?: () => void;
  className?: string;
};

export function WorkspaceTopbar({
  trailing,
  onBrandClick,
  className,
}: WorkspaceTopbarProps) {
  const { t } = useI18n();

  return (
    <header
      className={cn(
        "bg-background/90 sticky top-0 z-20 shrink-0 border-b border-border backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-space-8 px-space-16 py-space-8 md:px-space-32">
        <Link
          to="/"
          onClick={onBrandClick}
          className="text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("app.title")}
        >
          <BrandMark
            size="sm"
            lockup="horizontal"
            wordmark={t("app.title")}
            className="text-foreground"
          />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-space-8">
          {trailing}
          <WorkspaceViewSwitcher />
        </div>
      </div>
    </header>
  );
}
