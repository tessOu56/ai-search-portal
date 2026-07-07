import { streamChatInternalEvents } from "@ai-search-portal/agent-core";
import { chatQueryParamsSchema } from "@ai-search-portal/contracts";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";

const corsOrigin = process.env.CORS_ORIGIN;

function getTraceId(c: Context): string | undefined {
  const tp = c.req.header("traceparent");
  if (tp) {
    const parts = tp.split("-");
    if (parts.length >= 4 && parts[1]) return parts[1];
  }
  return c.req.header("x-trace-id") ?? undefined;
}
const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:5173"];
const origin =
  corsOrigin === undefined || corsOrigin === ""
    ? DEV_ORIGINS
    : corsOrigin.split(",").map((s) => s.trim());

export const app = new Hono();

app.use(
  "*",
  cors({
    origin,
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "traceparent", "tracestate", "x-trace-id"],
  })
);

app.get("/health", (c) => c.json({ ok: true }));

/**
 * Agent 對內 HTTP：**內部** SSE（internal.*）。Gateway 負責映射為對外穩定事件。
 */
app.get("/v1/chat/stream", (c) => {
  const raw = {
    q: c.req.query("q") ?? "",
    sessionId: c.req.query("sessionId"),
  };
  const parsed = chatQueryParamsSchema.safeParse(raw);
  if (!parsed.success) {
    return c.text("Missing or invalid query", 400);
  }

  const traceId = getTraceId(c);

  return streamSSE(c, async (stream) => {
    for await (const part of streamChatInternalEvents({
      query: parsed.data.q,
      traceId,
      emitMockToolStatus: true,
      includeRagSteps: true,
    })) {
      await stream.writeSSE({
        event: part.event,
        data: part.data,
      });
    }
  });
});
