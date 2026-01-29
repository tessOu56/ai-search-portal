import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "~/shared/utils/cn";

const bubbleVariants = cva(
  "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
  {
    variants: {
      variant: {
        user: "ml-auto bg-primary text-primary-foreground",
        assistant: "mr-auto bg-muted text-foreground",
        system: "mx-auto bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "assistant",
    },
  }
);

type ChatBubbleProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof bubbleVariants>;

export function ChatBubble({ className, variant, ...props }: ChatBubbleProps) {
  return (
    <div className={cn(bubbleVariants({ variant, className }))} {...props} />
  );
}
