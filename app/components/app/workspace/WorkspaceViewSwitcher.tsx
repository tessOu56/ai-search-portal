import { Link, useSearchParams } from "@remix-run/react";

import { Button } from "~/components/ui/Button";
import { cn } from "~/shared/utils/cn";

type WorkspaceView = "chat" | "saas";

type WorkspaceViewSwitcherProps = {
  className?: string;
};

const VIEW_PARAM = "view";

export function WorkspaceViewSwitcher({
  className,
}: WorkspaceViewSwitcherProps) {
  const [searchParams] = useSearchParams();
  const current =
    (searchParams.get(VIEW_PARAM) as WorkspaceView | null) ?? "chat";

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
      aria-label="Workspace view switcher"
      role="tablist"
    >
      <ViewChip
        to={makeHref("chat")}
        isActive={current === "chat"}
        label="AI Chat"
      />
      <ViewChip
        to={makeHref("saas")}
        isActive={current === "saas"}
        label="SaaS Dashboard"
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
