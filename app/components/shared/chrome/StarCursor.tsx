import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const INTERACTIVE =
  "a,button,input,textarea,select,label,[role='button'],[role='tab'],[role='menuitem'],[role='option'],[data-star-hot]";

type Point = { x: number; y: number };
type Mode = "normal" | "hover";

function parseRgb(
  color: string
): { r: number; g: number; b: number; a: number } | null {
  if (!color.startsWith("rgb")) return null;
  const inner = color.slice(color.indexOf("(") + 1, color.lastIndexOf(")"));
  const parts = inner.split(",").map((p) => Number(p.trim()));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return {
    r: parts[0] ?? 0,
    g: parts[1] ?? 0,
    b: parts[2] ?? 0,
    a: parts.length > 3 ? (parts[3] ?? 1) : 1,
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const channels = [r, g, b];
  const lin = channels.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const lr = lin[0] ?? 0;
  const lg = lin[1] ?? 0;
  const lb = lin[2] ?? 0;
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function sampleUnderPoint(
  x: number,
  y: number,
  ignore: Element | null
): string {
  const prev =
    ignore instanceof HTMLElement ? ignore.style.pointerEvents : null;
  if (ignore instanceof HTMLElement) ignore.style.pointerEvents = "none";
  const el = document.elementFromPoint(x, y);
  if (ignore instanceof HTMLElement) {
    ignore.style.pointerEvents = prev ?? "";
  }

  let node: Element | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    const rgb = parseRgb(bg);
    if (rgb && rgb.a > 0.08) {
      const L = relativeLuminance(rgb.r, rgb.g, rgb.b);
      return L > 0.45 ? "#0a0a0a" : "#f5f5f5";
    }
    node = node.parentElement;
  }

  const canvas = getComputedStyle(document.documentElement).getPropertyValue(
    "--surface-canvas"
  );
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const fallback = parseRgb(
    bodyBg.trim() || canvas.trim() || "rgb(250,248,245)"
  );
  if (fallback) {
    const L = relativeLuminance(fallback.r, fallback.g, fallback.b);
    return L > 0.45 ? "#0a0a0a" : "#f5f5f5";
  }
  return "#0a0a0a";
}

/**
 * Dual-dot cursor in an invisible 6×6 field.
 * 2px top-left + 4px bottom-right; contrast color from under-pointer bg; hover = collide.
 */
export function StarCursor() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [point, setPoint] = useState<Point | null>(null);
  const [mode, setMode] = useState<Mode>("normal");
  const [dotColor, setDotColor] = useState("#0a0a0a");

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const hover = window.matchMedia("(hover: hover)").matches;
    if (!fine || !hover || reduceMotion) {
      setEnabled(false);
      return;
    }
    setEnabled(true);
    document.documentElement.classList.add("star-cursor-active");

    const onMove = (event: PointerEvent) => {
      setPoint({ x: event.clientX, y: event.clientY });
      const contrast = sampleUnderPoint(
        event.clientX,
        event.clientY,
        rootRef.current
      );
      setDotColor(contrast);
      const target = event.target;
      if (!(target instanceof Element)) {
        setMode("normal");
        return;
      }
      const hot = target.closest(INTERACTIVE);
      setMode(hot ? "hover" : "normal");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("star-cursor-active");
    };
  }, [reduceMotion]);

  if (!enabled || !point) return null;

  const colliding = mode === "hover";

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed left-0 top-0 z-[95]"
      style={{
        transform: `translate3d(${point.x}px, ${point.y}px, 0)`,
        width: 6,
        height: 6,
        ["--cursor-dot" as string]: dotColor,
      }}
      aria-hidden
    >
      <motion.span
        className="absolute block rounded-full bg-[var(--cursor-dot)]"
        style={{ width: 2, height: 2 }}
        initial={false}
        animate={
          colliding
            ? {
                x: [0, 1.5, 2, 1.5, 0],
                y: [0, 1.5, 2, 1.5, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={
          colliding
            ? {
                duration: 0.42,
                ease: "easeInOut",
                times: [0, 0.35, 0.5, 0.65, 1],
                repeat: Infinity,
                repeatDelay: 0.55,
              }
            : { duration: 0.18 }
        }
      />
      <motion.span
        className="absolute block rounded-full bg-[var(--cursor-dot)]"
        style={{ width: 4, height: 4, left: 2, top: 2 }}
        initial={false}
        animate={
          colliding
            ? {
                x: [0, -0.75, -1, -0.75, 0],
                y: [0, -0.75, -1, -0.75, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={
          colliding
            ? {
                duration: 0.42,
                ease: "easeInOut",
                times: [0, 0.35, 0.5, 0.65, 1],
                repeat: Infinity,
                repeatDelay: 0.55,
              }
            : { duration: 0.18 }
        }
      />
    </div>
  );
}
