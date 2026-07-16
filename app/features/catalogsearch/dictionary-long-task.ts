/**
 * T-2026-064 — PerformanceObserver for long tasks during dictionary interaction.
 */
export type LongTaskRecord = {
  countOver50Ms: number;
  maxDurationMs: number;
  entries: { duration: number; startTime: number }[];
};

export function startLongTaskObserver(
  onUpdate?: (record: LongTaskRecord) => void
): () => LongTaskRecord {
  const record: LongTaskRecord = {
    countOver50Ms: 0,
    maxDurationMs: 0,
    entries: [],
  };

  if (typeof PerformanceObserver === "undefined") {
    return () => record;
  }

  let observer: PerformanceObserver | null = null;
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = entry.duration;
        if (duration > 50) {
          record.countOver50Ms += 1;
          record.maxDurationMs = Math.max(record.maxDurationMs, duration);
          record.entries.push({
            duration,
            startTime: entry.startTime,
          });
          onUpdate?.({ ...record, entries: [...record.entries] });
        }
      }
    });
    observer.observe({ type: "longtask", buffered: true });
  } catch {
    // longtask not supported in this browser
  }

  return () => {
    observer?.disconnect();
    return record;
  };
}
