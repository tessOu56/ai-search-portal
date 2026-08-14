import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "~/shared/utils/cn";

const bubbleVariants = cva("max-w-[min(80%,42rem)] text-type-16", {
  variants: {
    variant: {
      user: "ml-auto text-right text-foreground",
      assistant: "mr-auto text-foreground",
      system: "mx-auto text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "assistant",
  },
});

type ChatBubbleProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof bubbleVariants>;

export function ChatBubble({ className, variant, ...props }: ChatBubbleProps) {
  return (
    <div className={cn(bubbleVariants({ variant }), className)} {...props} />
  );
}
