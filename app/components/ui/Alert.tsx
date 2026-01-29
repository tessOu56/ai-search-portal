import type { HTMLAttributes } from "react";

import { cn } from "~/shared/utils/cn";

type AlertProps = HTMLAttributes<HTMLDivElement>;

export function Alert({ className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border border-border bg-background px-6 py-4 text-sm text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: AlertProps) {
  return (
    <h5 className={cn("mb-1 font-medium leading-none", className)} {...props} />
  );
}

export function AlertDescription({ className, ...props }: AlertProps) {
  return (
    <div
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
