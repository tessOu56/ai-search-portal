import type { ReactNode } from "react";

import { EmptyState } from "~/components/ui/EmptyState";
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

/**
 * Results block without an outer card — DataTable / list owns its own surface.
 * Loading and empty still use SDK Skeleton / EmptyState.
 */
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
    <section
      className="flex flex-col gap-stack"
      aria-labelledby="product-results-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-space-8">
        <div className="flex flex-col gap-space-4">
          <h2
            id="product-results-title"
            className="text-type-16 font-medium text-foreground"
          >
            {title}
          </h2>
          {description ? (
            <p className="text-type-14 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerExtra}
      </div>
      <div className="flex flex-col gap-stack">
        {isLoading ? (
          <div
            role="status"
            aria-label={loadingLabel}
            className="flex flex-col gap-space-8"
          >
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
    </section>
  );
}

export type ProductResultsEmptyProps = {
  message: string;
};

export function ProductResultsEmpty({ message }: ProductResultsEmptyProps) {
  return <EmptyState title={message} />;
}
