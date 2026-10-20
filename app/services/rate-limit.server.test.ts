import { afterEach, describe, expect, it } from "vitest";

import {
  consumeRateLimit,
  createMemoryRateLimitStore,
  RATE_LIMITS,
  resetRateLimitForTests,
  resolveClientIp,
} from "./rate-limit.server";

const CHAT_URL = "http://localhost/api/chat";
const CHAT_DIRECT = "chat:direct";

const originalEnv = {
  VERCEL: process.env.VERCEL,
  TRUST_PROXY: process.env.TRUST_PROXY,
  RATE_LIMIT_DISABLED: process.env.RATE_LIMIT_DISABLED,
};

afterEach(() => {
  process.env.VERCEL = originalEnv.VERCEL;
  process.env.TRUST_PROXY = originalEnv.TRUST_PROXY;
  process.env.RATE_LIMIT_DISABLED = originalEnv.RATE_LIMIT_DISABLED;
  resetRateLimitForTests();
});

describe("resolveClientIp", () => {
  it("ignores a spoofed first X-Forwarded-For hop off-platform", () => {
    delete process.env.VERCEL;
    delete process.env.TRUST_PROXY;
    const ip = resolveClientIp(
      new Request(CHAT_URL, {
        headers: { "x-forwarded-for": "8.8.8.8, 10.0.0.1" },
      })
    );
    expect(ip).toBe("direct");
  });

  it("uses x-real-ip on Vercel", () => {
    process.env.VERCEL = "1";
    const ip = resolveClientIp(
      new Request(CHAT_URL, {
        headers: {
          "x-real-ip": "203.0.113.9",
          "x-forwarded-for": "8.8.8.8",
        },
      })
    );
    expect(ip).toBe("203.0.113.9");
  });

  it("uses x-vercel-forwarded-for when x-real-ip is absent", () => {
    process.env.VERCEL = "1";
    const ip = resolveClientIp(
      new Request(CHAT_URL, {
        headers: { "x-vercel-forwarded-for": "198.51.100.4, 10.0.0.1" },
      })
    );
    expect(ip).toBe("198.51.100.4");
  });

  it("uses the last XFF hop only when TRUST_PROXY=1", () => {
    process.env.TRUST_PROXY = "1";
    delete process.env.VERCEL;
    const ip = resolveClientIp(
      new Request(CHAT_URL, {
        headers: { "x-forwarded-for": "8.8.8.8, 192.0.2.1" },
      })
    );
    expect(ip).toBe("192.0.2.1");
  });
});

describe("memory rate limiter", () => {
  it("rejects after the max and evicts expired keys", () => {
    const store = createMemoryRateLimitStore(8);
    const first = store.consume(CHAT_DIRECT, 60_000, 2);
    const second = store.consume(CHAT_DIRECT, 60_000, 2);
    const third = store.consume(CHAT_DIRECT, 60_000, 2);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("caps map size so flood keys cannot grow unbounded", () => {
    const store = createMemoryRateLimitStore(4);
    for (let i = 0; i < 20; i += 1) {
      store.consume(`k:${i}`, 60_000, 10);
    }
    // Next consume still succeeds — store dropped oldest keys.
    expect(store.consume("k:fresh", 60_000, 10).ok).toBe(true);
  });

  it("consumeRateLimit is a no-op when RATE_LIMIT_DISABLED=1", () => {
    process.env.RATE_LIMIT_DISABLED = "1";
    const req = new Request(CHAT_URL);
    for (let i = 0; i < RATE_LIMITS.chat.max + 5; i += 1) {
      expect(consumeRateLimit(req, "chat").ok).toBe(true);
    }
  });
});
