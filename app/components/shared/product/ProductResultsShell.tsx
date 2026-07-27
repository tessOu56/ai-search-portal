import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";

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
  /** Grid column classes for skeleton rows (e.g. `grid-cols-[1fr_2fr_auto]`). */
  skeletonGridClass?: string;
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
  skeletonGridClass = "grid-cols-[1fr_2fr_auto]",
  skeletonRows = 2,
}: ProductResultsShellProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {headerExtra}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-border">
          {isLoading ? (
            <div
              aria-label={loadingLabel}
              role="status"
              className="divide-y divide-border"
            >
              {Array.from({ length: skeletonRows }, (_, index) => (
                <div
                  key={index}
                  className={`grid animate-pulse ${skeletonGridClass} items-center gap-2 px-4 py-3`}
                >
                  <span className="h-4 rounded bg-muted" />
                  <span className="h-4 rounded bg-muted" />
                  <span className="h-6 w-16 justify-self-end rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <ProductResultsEmpty message={emptyMessage} />
          ) : (
            children
          )}
        </div>
        {!isLoading && isEmpty && emptyAction ? (
          <div className="flex justify-center">{emptyAction}</div>
        ) : null}
        {pagination}
      </CardContent>
    </Card>
  );
}

export type ProductResultsEmptyProps = {
  message: string;
};

export function ProductResultsEmpty({ message }: ProductResultsEmptyProps) {
  return <p className="px-4 py-6 text-muted-foreground">{message}</p>;
}
