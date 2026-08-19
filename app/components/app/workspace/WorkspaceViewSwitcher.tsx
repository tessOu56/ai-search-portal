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

export function WorkspaceViewSwitcher({
  className,
}: WorkspaceViewSwitcherProps) {
  const { t } = useI18n();
  const { mode, overviewReturnHref, rememberCurrentIfOverview } =
    useWorkspaceSession();

  return (
    <SegmentedNav
      density="icon"
      aria-label={t("home.nav.switcher")}
      className={cn(className)}
    >
      <SegmentedNavItem
        asChild
        current={mode === "ask"}
        aria-label={t("home.nav.ask")}
      >
        <Link to={ASK_HOME} onClick={rememberCurrentIfOverview}>
          <Sparkles className="size-4" aria-hidden />
        </Link>
      </SegmentedNavItem>
      <SegmentedNavItem
        asChild
        current={mode === "overview"}
        aria-label={t("home.nav.overview")}
      >
        <Link to={overviewReturnHref}>
          <Compass className="size-4" aria-hidden />
        </Link>
      </SegmentedNavItem>
    </SegmentedNav>
  );
}
