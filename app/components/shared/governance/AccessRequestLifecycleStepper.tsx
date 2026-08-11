import type { AccessRequestLifecycleStatus } from "~/shared/contracts";
import { cn } from "~/shared/utils/cn";

/**
 * Visual lifecycle stepper — draft → pending_approval → approved, with
 * denied / cancelled / expired rendered as a distinct terminal branch off
 * the pending step (T-186 tool-density polish, Journey C).
 */

type StepDef = { key: AccessRequestLifecycleStatus; label: string };

const HAPPY_PATH: StepDef[] = [
  { key: "draft", label: "Draft" },
  { key: "pending_approval", label: "Pending review" },
  { key: "approved", label: "Approved" },
];

const TERMINAL_LABEL: Partial<Record<AccessRequestLifecycleStatus, string>> = {
  denied: "Denied",
  cancelled: "Cancelled",
  expired: "Expired",
};

const NEGATIVE_STATUSES = new Set<AccessRequestLifecycleStatus>([
  "denied",
  "cancelled",
  "expired",
]);

type StepVisualState = "done" | "active" | "success" | "negative" | "upcoming";

function stepState(
  index: number,
  currentIndex: number,
  isNegative: boolean,
  key: AccessRequestLifecycleStatus
): StepVisualState {
  if (index < currentIndex) return "done";
  if (index > currentIndex) return "upcoming";
  if (isNegative) return "negative";
  if (key === "approved") return "success";
  return "active";
}

const CIRCLE_CLASS: Record<StepVisualState, string> = {
  done: "border-primary bg-primary text-primary-foreground",
  active: "border-primary bg-primary/10 text-primary",
  success: "border-green-600 bg-green-600 text-white",
  negative: "border-destructive bg-destructive text-destructive-foreground",
  upcoming: "border-border bg-muted text-muted-foreground",
};

const LABEL_CLASS: Record<StepVisualState, string> = {
  done: "text-foreground",
  active: "text-foreground font-medium",
  success: "text-foreground font-medium",
  negative: "text-destructive font-medium",
  upcoming: "text-muted-foreground",
};

const LINE_CLASS: Record<StepVisualState, string> = {
  done: "bg-primary",
  active: "bg-border",
  success: "bg-green-600",
  negative: "bg-destructive",
  upcoming: "bg-border",
};

export type AccessRequestLifecycleStepperProps = {
  status: AccessRequestLifecycleStatus;
  className?: string;
  /** Compact = icons only, no text labels (for tight card layouts). */
  compact?: boolean;
};

export function AccessRequestLifecycleStepper({
  status,
  className,
  compact = false,
}: AccessRequestLifecycleStepperProps) {
  const isNegative = NEGATIVE_STATUSES.has(status);
  const currentIndex = isNegative
    ? 2
    : Math.max(
        0,
        HAPPY_PATH.findIndex((step) => step.key === status)
      );

  const steps: StepDef[] = isNegative
    ? [
        ...HAPPY_PATH.slice(0, 2),
        {
          key: status,
          // eslint-disable-next-line security/detect-object-injection -- status is a typed AccessRequestLifecycleStatus
          label: TERMINAL_LABEL[status] ?? status,
        },
      ]
    : HAPPY_PATH;

  return (
    <ol
      className={cn("flex items-center gap-1.5 text-xs", className)}
      aria-label="Application lifecycle status"
      data-testid="access-request-stepper"
      data-status={status}
    >
      {steps.map((step, index) => {
        const state = stepState(index, currentIndex, isNegative, step.key);
        const isLast = index === steps.length - 1;
        return (
          <li
            key={step.key}
            className="flex items-center gap-1.5"
            aria-current={index === currentIndex ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                // eslint-disable-next-line security/detect-object-injection -- state is a typed StepVisualState
                CIRCLE_CLASS[state]
              )}
              aria-hidden="true"
            >
              {state === "done" ? "✓" : index + 1}
            </span>
            {!compact ? (
              <span
                className={cn(
                  "whitespace-nowrap",
                  // eslint-disable-next-line security/detect-object-injection -- state is a typed StepVisualState
                  LABEL_CLASS[state]
                )}
              >
                {step.label}
              </span>
            ) : (
              <span className="sr-only">{step.label}</span>
            )}
            {!isLast ? (
              <span
                className={cn(
                  "h-px w-4 shrink-0",
                  // eslint-disable-next-line security/detect-object-injection -- state is a typed StepVisualState
                  LINE_CLASS[state]
                )}
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
