import { timingSafeEqual } from "node:crypto";

import type { Context, Next } from "hono";

function readToken(): string | undefined {
  const value = process.env.AGENT_RUNTIME_TOKEN?.trim();
  return value ? value : undefined;
}

function secureCompare(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  const len = Math.max(leftBuf.length, rightBuf.length, 1);
  const paddedLeft = Buffer.alloc(len);
  const paddedRight = Buffer.alloc(len);
  leftBuf.copy(paddedLeft);
  rightBuf.copy(paddedRight);
  return (
    timingSafeEqual(paddedLeft, paddedRight) &&
    leftBuf.length === rightBuf.length
  );
}

/**
 * Protect /v1/chat/stream.
 * Production (NODE_ENV=production) fail-closes without AGENT_RUNTIME_TOKEN.
 * Development without a token stays open for local in-process workflows.
 */
export async function requireAgentRuntimeToken(c: Context, next: Next) {
  const expected = readToken();
  const production = process.env.NODE_ENV === "production";
  if (!expected) {
    if (production) {
      return c.json(
        {
          error: "Agent runtime token is not configured",
          code: "AUTH_NOT_CONFIGURED",
        },
        503
      );
    }
    await next();
    return;
  }

  const header = c.req.header("Authorization") ?? "";
  const match = /^Bearer\s+(\S+)/i.exec(header.trim());
  const presented = match?.[1]?.trim();
  if (!presented || !secureCompare(presented, expected)) {
    return c.json(
      { error: "Authentication required", code: "UNAUTHENTICATED" },
      401
    );
  }
  await next();
}
