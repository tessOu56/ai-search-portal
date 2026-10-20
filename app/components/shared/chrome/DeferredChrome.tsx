import { lazy, Suspense, useEffect, useState } from "react";

const NavProgress = lazy(async () => {
  const mod = await import("~/components/shared/chrome/NavProgress");
  return { default: mod.NavProgress };
});

const StarCursor = lazy(async () => {
  const mod = await import("~/components/shared/chrome/StarCursor");
  return { default: mod.StarCursor };
});

/**
 * Motion chrome is decorative. Defer until idle so first paint does not wait
 * on the motion runtime.
 */
export function DeferredChrome() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(enable);
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(enable, 1);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <NavProgress />
      <StarCursor />
    </Suspense>
  );
}
