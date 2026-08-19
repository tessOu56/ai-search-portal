import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
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
      </CardContent>
    </Card>
  );
}

export type ProductResultsEmptyProps = {
  message: string;
};

export function ProductResultsEmpty({ message }: ProductResultsEmptyProps) {
  return <EmptyState title={message} />;
}
