import { useNavigation } from "@remix-run/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Top navigation progress — transform-based for smooth enter/exit (not jump width).
 */
export function NavProgress() {
  const navigation = useNavigation();
  const reduceMotion = useReducedMotion();
  const busy = navigation.state !== "idle";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (busy) {
      setVisible(true);
      return;
    }
    if (!visible) return;
    const t = window.setTimeout(() => setVisible(false), 420);
    return () => window.clearTimeout(t);
  }, [busy, visible]);

  if (!visible && !busy) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5 overflow-hidden"
      aria-hidden
    >
      <motion.div
        className="h-full origin-left bg-primary"
        initial={false}
        animate={
          reduceMotion
            ? { scaleX: busy ? 1 : 0, opacity: busy ? 1 : 0 }
            : busy
              ? { scaleX: [0.12, 0.55, 0.82], opacity: 1 }
              : { scaleX: 1, opacity: 0 }
        }
        transition={
          reduceMotion
            ? { duration: 0.2 }
            : busy
              ? {
                  scaleX: {
                    duration: 1.6,
                    ease: [0.22, 1, 0.36, 1],
                    repeat: Infinity,
                    repeatType: "mirror",
                  },
                  opacity: { duration: 0.2 },
                }
              : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
        }
      />
    </div>
  );
}
