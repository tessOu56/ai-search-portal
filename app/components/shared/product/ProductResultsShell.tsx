import type { ReactNode } from "react";

import { EmptyState } from "~/components/ui/EmptyState";
import { Panel } from "~/components/ui/Panel";
import { Skeleton } from "~/components/ui/Skeleton";

export type ProductResultsShellProps = {
  title: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  loadingLabel?: string;
  emptyMessage: string;
  emptyAction?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
  skeletonRows?: number;
};

export function ProductResultsShell({
  title,
  description,
  isLoading = false,
  isEmpty = false,
  loadingLabel = "Loading results",
  emptyMessage,
  emptyAction,
  headerExtra,
  children,
  pagination,
  skeletonRows = 3,
}: ProductResultsShellProps) {
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-type-16 font-medium text-foreground">{title}</h2>
          {description ? (
            <p className="text-type-14 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerExtra}
      </div>
      <div className="space-y-4">
        {isLoading ? (
          <div role="status" aria-label={loadingLabel} className="space-y-2">
            {Array.from({ length: skeletonRows }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState title={emptyMessage} action={emptyAction} />
        ) : (
          children
        )}
        {pagination}
      </div>
    </Panel>
  );
}

export type ProductResultsEmptyProps = {
  message: string;
};

export function ProductResultsEmpty({ message }: ProductResultsEmptyProps) {
  return <EmptyState title={message} />;
}
