import type { HTMLAttributes } from "react";

import { cn } from "~/shared/utils/cn";

type CalloutProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "info" | "warning";
};

function getToneClasses(tone: CalloutProps["tone"]) {
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-primary-100 bg-primary-50 text-primary-700";
}

export function Callout({ className, tone = "info", ...props }: CalloutProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-6 py-4 text-sm",
        getToneClasses(tone),
        className
      )}
      {...props}
    />
  );
}
