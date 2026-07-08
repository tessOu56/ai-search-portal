import type { HTMLAttributes } from "react";

import { cn } from "~/shared/utils/cn";

type CalloutProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "info" | "warning";
};

function getToneClasses(tone: CalloutProps["tone"]) {
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
  }
  // fix: brand-* scale 已自 config 移除（token SSOT: SDK semantic vars），改用 semantic classes 隨主題/模式取值
  return "border-primary/25 bg-primary/10 text-foreground";
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
