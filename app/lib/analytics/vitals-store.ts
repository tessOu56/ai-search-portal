/**
 * In-memory + sessionStorage mirror for live Web Vitals (T-2026-115, Pillar 4).
 *
 * Fed by `web-vitals-reporter.ts` on every `onLCP`/`onINP`/`onCLS` callback,
 * independent of the optional PostHog-style POST. Powers `app/routes/vitals.tsx`
 * without requiring a backend — everything lives in the browser tab/session.
 */

import type { WebVitalName, WebVitalRating } from "@ai-search-portal/contracts";

export type StoredVital = {
  name: WebVitalName;
  value: number;
  rating: WebVitalRating;
  route: string;
  at: string;
};

const STORAGE_KEY = "ai-search-portal:web-vitals";

const memoryStore = new Map<WebVitalName, StoredVital>();
const listeners = new Set<() => void>();
let hydrated = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadFromSession(): void {
  if (!isBrowser()) return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as StoredVital[];
    if (!Array.isArray(parsed)) return;
    for (const vital of parsed) {
      if (vital && typeof vital.name === "string") {
        memoryStore.set(vital.name, vital);
      }
    }
  } catch {
    // Corrupt/blocked storage: fall back to in-memory only.
  }
}

function persist(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...memoryStore.values()])
    );
  } catch {
    // Storage quota/availability issues must never break the reporter.
  }
}

function ensureHydrated(): void {
  if (hydrated || !isBrowser()) return;
  loadFromSession();
  hydrated = true;
}

function notify(): void {
  for (const listener of listeners) listener();
}

/** Called by the web-vitals reporter on every metric callback (always, regardless of POST env). */
export function recordVital(vital: StoredVital): void {
  if (!isBrowser()) return;
  ensureHydrated();
  const previous = memoryStore.get(vital.name);
  if (
    previous &&
    previous.value === vital.value &&
    previous.rating === vital.rating &&
    previous.route === vital.route
  ) {
    return;
  }
  memoryStore.set(vital.name, vital);
  persist();
  notify();
}

/** Latest known value per metric, sorted for stable render order. */
export function getVitals(): StoredVital[] {
  ensureHydrated();
  return [...memoryStore.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Subscribe to updates (new metric recorded); returns an unsubscribe fn. */
export function subscribeVitals(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Clears the local mirror (session tab only) — exposed for a "reset" affordance. */
export function clearVitals(): void {
  memoryStore.clear();
  if (isBrowser()) {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  notify();
}
