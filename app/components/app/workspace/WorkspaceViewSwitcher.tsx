import { Link } from "@remix-run/react";
import { Compass, Sparkles } from "lucide-react";

import { SegmentedNav, SegmentedNavItem } from "~/components/ui/SegmentedNav";
import { ASK_HOME } from "~/lib/workspace-mode";
import { useI18n } from "~/shared/i18n/context";
import { cn } from "~/shared/utils/cn";

import { useWorkspaceSession } from "./WorkspaceSession";

type WorkspaceViewSwitcherProps = {
  className?: string;
};

/**
 * Ask ↔ Overview destinations. Label density (not icon-only, not Switch).
 * On narrow viewports items shrink so the h-12 topbar does not overflow.
 */
export function WorkspaceViewSwitcher({
  className,
}: WorkspaceViewSwitcherProps) {
  const { t } = useI18n();
  const { mode, overviewReturnHref, rememberCurrentIfOverview } =
    useWorkspaceSession();

  const itemClass = "min-w-0 gap-1 px-2.5 sm:min-w-28 sm:gap-1.5 sm:px-3";

  return (
    <SegmentedNav
      aria-label={t("home.nav.switcher")}
      className={cn("max-w-full shrink", className)}
    >
      <SegmentedNavItem asChild current={mode === "ask"} className={itemClass}>
        <Link to={ASK_HOME} onClick={rememberCurrentIfOverview}>
          <Sparkles className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{t("home.nav.ask")}</span>
        </Link>
      </SegmentedNavItem>
      <SegmentedNavItem
        asChild
        current={mode === "overview"}
        className={itemClass}
      >
        <Link to={overviewReturnHref}>
          <Compass className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{t("home.nav.overview")}</span>
        </Link>
      </SegmentedNavItem>
    </SegmentedNav>
  );
}
