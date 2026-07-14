import { type HTMLAttributes, useId } from "react";

import { cn } from "~/shared/utils/cn";

type BrandMarkSize = "sm" | "md" | "lg" | "xl";
type BrandMarkMode = "flat" | "tilt";
type BrandMarkLockup = "mark" | "horizontal" | "stacked";

export type BrandMarkProps = HTMLAttributes<HTMLSpanElement> & {
  size?: BrandMarkSize;
  /** flat = static; tilt = light 3D rest. Forced flat when size is sm. */
  mode?: BrandMarkMode;
  /** Enable hover/focus (tilt + comet arc). sm never runs the arc. */
  interactive?: boolean;
  /** Optional product endonym (Portal, Command, Plinth, Vesper) */
  wordmark?: string;
  /**
   * CIS lockup. Defaults to `horizontal` when wordmark is set, else `mark`.
   */
  lockup?: BrandMarkLockup;
};

const SIZE_CLASS: Record<BrandMarkSize, string> = {
  sm: "eds-brand-mark--sm",
  md: "eds-brand-mark--md",
  lg: "eds-brand-mark--lg",
  xl: "eds-brand-mark--xl",
};

function sizeClassName(size: BrandMarkSize): string {
  switch (size) {
    case "sm":
      return SIZE_CLASS.sm;
    case "lg":
      return SIZE_CLASS.lg;
    case "xl":
      return SIZE_CLASS.xl;
    default:
      return SIZE_CLASS.md;
  }
}

/** Stroke-only 米字 — shorter diagonals first, gold cross on top. */
function MiAsteriskSvg() {
  return (
    <svg
      // EDS brand CSS classes (not Tailwind utilities)
      // eslint-disable-next-line tailwindcss/no-custom-classname -- brand-mark.css
      className="eds-brand-mark-svg eds-brand-mark-star"
      viewBox="0 0 64 64"
      aria-hidden
      focusable="false"
    >
      <line
        className="eds-brand-ray eds-brand-ray--secondary"
        x1="18"
        y1="18"
        x2="46"
        y2="46"
      />
      <line
        className="eds-brand-ray eds-brand-ray--secondary"
        x1="46"
        y1="18"
        x2="18"
        y2="46"
      />
      <line
        className="eds-brand-ray eds-brand-ray--primary"
        x1="32"
        y1="8"
        x2="32"
        y2="56"
      />
      <line
        className="eds-brand-ray eds-brand-ray--primary"
        x1="8"
        y1="32"
        x2="56"
        y2="32"
      />
    </svg>
  );
}

/** Comet ball + taper trail; CSS rotates SW→NE then fades. */
function ArcCometSvg() {
  const trailId = `eds-comet-trail-${useId().replace(/:/g, "")}`;

  return (
    <svg
      className="eds-brand-mark-orbit-svg"
      viewBox="0 0 64 64"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient
          id={trailId}
          gradientUnits="userSpaceOnUse"
          x1="32"
          y1="14"
          x2="32"
          y2="3"
        >
          <stop
            offset="0%"
            stopColor="var(--eds-brand-stroke-spark)"
            stopOpacity="0"
          />
          <stop
            offset="55%"
            stopColor="var(--eds-brand-stroke-spark)"
            stopOpacity="0.55"
          />
          <stop
            offset="100%"
            stopColor="var(--eds-brand-stroke-primary)"
            stopOpacity="0.95"
          />
        </linearGradient>
      </defs>
      <g className="eds-brand-mark-comet-arm">
        <line
          className="eds-brand-mark-comet-trail"
          x1="32"
          y1="14"
          x2="32"
          y2="4.5"
          stroke={`url(#${trailId})`}
        />
        <circle
          className="eds-brand-mark-comet-ball"
          cx="32"
          cy="3.5"
          r="2.2"
        />
      </g>
    </svg>
  );
}

function resolveLockup(
  lockup: BrandMarkLockup | undefined,
  wordmark: string | undefined
): BrandMarkLockup {
  return lockup ?? (wordmark ? "horizontal" : "mark");
}

/**
 * Vesper mark — fine-line 米字 + comet-ball arc on hover.
 * Requires brand-mark.css and application token CSS. See docs/CIS-VESPER.md.
 */
export function BrandMark({
  className,
  size = "md",
  mode = "tilt",
  interactive = true,
  wordmark,
  lockup,
  ...props
}: BrandMarkProps) {
  const resolvedMode: BrandMarkMode = size === "sm" ? "flat" : mode;
  const resolvedLockup = resolveLockup(lockup, wordmark);
  const canInteract = resolvedMode === "tilt" && interactive;
  const showArc = size !== "sm" && canInteract;
  const sizeClass = sizeClassName(size);
  const modeClass =
    resolvedMode === "flat" ? "eds-brand-mark--flat" : "eds-brand-mark--tilt";

  const mark = (
    <span
      className={cn(
        "eds-brand-mark",
        modeClass,
        sizeClass,
        resolvedLockup === "mark" && className
      )}
      data-interactive={canInteract ? "" : undefined}
      aria-hidden={resolvedLockup !== "mark" ? true : undefined}
      {...(resolvedLockup === "mark" ? props : {})}
    >
      <span className="eds-brand-mark-orbit">
        {showArc ? <ArcCometSvg /> : null}
        <span className="eds-brand-mark-stage">
          <span className="eds-brand-mark-body">
            <MiAsteriskSvg />
          </span>
        </span>
      </span>
    </span>
  );

  if (resolvedLockup === "mark" || !wordmark) return mark;

  const lockupOrientation =
    resolvedLockup === "stacked"
      ? "eds-brand-lockup--stacked"
      : "eds-brand-lockup--horizontal";

  return (
    <span
      className={cn("eds-brand-lockup", lockupOrientation, className)}
      {...props}
    >
      {mark}
      <span className="eds-brand-lockup-wordmark">{wordmark}</span>
    </span>
  );
}
