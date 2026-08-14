import { Link, useSearchParams } from "@remix-run/react";

import { Button } from "~/components/ui/Button";
import { useI18n } from "~/shared/i18n/context";
import { cn } from "~/shared/utils/cn";

type WorkspaceView = "chat" | "dashboard";

type WorkspaceViewSwitcherProps = {
  className?: string;
};

const VIEW_PARAM = "view";

export function WorkspaceViewSwitcher({
  className,
}: WorkspaceViewSwitcherProps) {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const raw = searchParams.get(VIEW_PARAM);
  // `saas` 為舊參數，視同 dashboard
  const current: WorkspaceView =
    raw === "dashboard" || raw === "saas" ? "dashboard" : "chat";

  const makeHref = (view: WorkspaceView) => {
    const next = new URLSearchParams(searchParams);
    if (view === "chat") {
      next.delete(VIEW_PARAM);
    } else {
      next.set(VIEW_PARAM, view);
    }
    const query = next.toString();
    return query ? `/?${query}` : "/";
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted p-1",
        className
      )}
      aria-label={t("home.nav.switcher")}
      role="tablist"
    >
      <ViewChip
        to={makeHref("chat")}
        isActive={current === "chat"}
        label={t("home.nav.ask")}
      />
      <ViewChip
        to={makeHref("dashboard")}
        isActive={current === "dashboard"}
        label={t("home.nav.overview")}
      />
    </div>
  );
}

type ViewChipProps = {
  to: string;
  isActive: boolean;
  label: string;
};

function ViewChip({ to, isActive, label }: ViewChipProps) {
  return (
    <Button
      asChild
      size="sm"
      variant={isActive ? "default" : "ghost"}
      className={cn(
        "rounded-full px-4",
        !isActive && "bg-transparent text-muted-foreground hover:bg-background"
      )}
      role="tab"
      aria-selected={isActive}
    >
      <Link to={to}>{label}</Link>
    </Button>
  );
}
