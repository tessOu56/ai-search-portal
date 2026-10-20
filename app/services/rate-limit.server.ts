/**
 * Bounded in-memory rate limiter.
 *
 * Client IP: only platform-provided headers (Vercel / Cloudflare) or the
 * last X-Forwarded-For hop when TRUST_PROXY=1. The first XFF value is never
 * trusted — clients can spoof it to bypass or partition buckets.
 *
 * Multi-instance (Vercel) deployments do not share this Map; remaining risk
 * is documented. Swap the store behind RateLimitStore when Redis is available.
 */

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 40;
const MAX_KEYS = 10_000;
const SWEEP_EVERY = 64;

export type RateLimitDecision = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

export type RateLimitStore = {
  consume: (key: string, windowMs: number, max: number) => RateLimitDecision;
  reset: () => void;
};

type Bucket = { count: number; resetAt: number };

function isDigits(value: string): boolean {
  if (value.length === 0) return false;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 48 || code > 57) return false;
  }
  return true;
}

function isIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((octet) => {
    if (octet.length === 0 || octet.length > 3 || !isDigits(octet))
      return false;
    const n = Number(octet);
    return n >= 0 && n <= 255;
  });
}

function isValidIp(value: string): boolean {
  if (value.length === 0 || value.length > 45) return false;
  if (value.includes("/") || value.includes(" ") || value.includes("<")) {
    return false;
  }
  if (isIpv4(value)) return true;
  return value.includes(":") && !value.includes(" ");
}

function firstValid(header: string | null): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(",")) {
    const trimmed = part.trim();
    if (isValidIp(trimmed)) return trimmed;
  }
  return undefined;
}

function lastValid(header: string | null): string | undefined {
  if (!header) return undefined;
  const hops = header
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const reversed = [...hops].reverse();
  for (const hop of reversed) {
    if (isValidIp(hop)) return hop;
  }
  return undefined;
}

export function resolveClientIp(request: Request): string {
  const onVercel = process.env.VERCEL === "1";
  const onCloudflare =
    process.env.CF_PAGES === "1" || Boolean(request.headers.get("cf-ray"));

  if (onVercel) {
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp && isValidIp(realIp)) return realIp;
    const vercel = firstValid(request.headers.get("x-vercel-forwarded-for"));
    if (vercel) return vercel;
  }

  if (onCloudflare) {
    const cf = request.headers.get("cf-connecting-ip")?.trim();
    if (cf && isValidIp(cf)) return cf;
  }

  if (process.env.TRUST_PROXY === "1") {
    const last = lastValid(request.headers.get("x-forwarded-for"));
    if (last) return last;
  }

  return "direct";
}

export function createMemoryRateLimitStore(maxKeys = MAX_KEYS): RateLimitStore {
  const buckets = new Map<string, Bucket>();
  let ops = 0;

  function sweep(now: number) {
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key);
    }
    if (buckets.size <= maxKeys) return;
    const overflow = buckets.size - maxKeys;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      removed += 1;
      if (removed >= overflow) break;
    }
  }

  return {
    consume(key: string, windowMs: number, max: number): RateLimitDecision {
      const now = Date.now();
      ops += 1;
      if (ops % SWEEP_EVERY === 0) sweep(now);

      const existing = buckets.get(key);
      if (!existing || now >= existing.resetAt) {
        if (buckets.size >= maxKeys) sweep(now);
        const resetAt = now + windowMs;
        buckets.set(key, { count: 1, resetAt });
        return {
          ok: true,
          remaining: Math.max(0, max - 1),
          resetAt,
          retryAfterSec: Math.ceil(windowMs / 1000),
        };
      }
      if (existing.count >= max) {
        return {
          ok: false,
          remaining: 0,
          resetAt: existing.resetAt,
          retryAfterSec: Math.max(
            1,
            Math.ceil((existing.resetAt - now) / 1000)
          ),
        };
      }
      existing.count += 1;
      return {
        ok: true,
        remaining: Math.max(0, max - existing.count),
        resetAt: existing.resetAt,
        retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      };
    },
    reset() {
      buckets.clear();
      ops = 0;
    },
  };
}

const defaultStore = createMemoryRateLimitStore();

export const RATE_LIMITS = {
  chat: { windowMs: DEFAULT_WINDOW_MS, max: DEFAULT_MAX },
  mcp: { windowMs: DEFAULT_WINDOW_MS, max: 30 },
  knowledge: { windowMs: DEFAULT_WINDOW_MS, max: 60 },
  governanceWrite: { windowMs: DEFAULT_WINDOW_MS, max: 40 },
  audit: { windowMs: DEFAULT_WINDOW_MS, max: 30 },
  auth: { windowMs: DEFAULT_WINDOW_MS, max: 20 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

function specForBucket(bucket: RateLimitBucket) {
  switch (bucket) {
    case "chat":
      return RATE_LIMITS.chat;
    case "mcp":
      return RATE_LIMITS.mcp;
    case "knowledge":
      return RATE_LIMITS.knowledge;
    case "governanceWrite":
      return RATE_LIMITS.governanceWrite;
    case "audit":
      return RATE_LIMITS.audit;
    default:
      return RATE_LIMITS.auth;
  }
}

export function consumeRateLimit(
  request: Request,
  bucket: RateLimitBucket,
  store: RateLimitStore = defaultStore
): RateLimitDecision {
  if (process.env.RATE_LIMIT_DISABLED === "1") {
    return {
      ok: true,
      remaining: 999,
      resetAt: Date.now() + 60_000,
      retryAfterSec: 60,
    };
  }
  const spec = specForBucket(bucket);
  const ip = resolveClientIp(request);
  return store.consume(`${bucket}:${ip}`, spec.windowMs, spec.max);
}

export function resetRateLimitForTests(): void {
  defaultStore.reset();
}

export function rateLimitResponse(decision: RateLimitDecision): Response {
  return Response.json(
    { error: "Too many requests", code: "RATE_LIMITED" },
    {
      status: 429,
      headers: {
        "Retry-After": String(decision.retryAfterSec),
        "Content-Type": "application/json",
      },
    }
  );
}
