/**
 * Idempotency-Key → requestId index helpers.
 */

export interface IdempotencyIndex {
  remember(key: string, requestId: string): void;
  resolve(key: string): string | null;
  clear(): void;
  size(): number;
}

export function createIdempotencyIndex(): IdempotencyIndex {
  const keys = new Map<string, string>();
  return {
    remember(key: string, requestId: string): void {
      keys.set(key, requestId);
    },
    resolve(key: string): string | null {
      return keys.get(key) ?? null;
    },
    clear(): void {
      keys.clear();
    },
    size(): number {
      return keys.size;
    },
  };
}
