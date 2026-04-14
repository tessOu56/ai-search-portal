import { Hono } from "hono";
import { cors } from "hono/cors";

import { itemsApi } from "./routes/items.js";

const corsOrigin = process.env.CORS_ORIGIN;
const origin =
  corsOrigin === undefined || corsOrigin === ""
    ? "*"
    : corsOrigin.split(",").map((s) => s.trim());

export const app = new Hono();

app.use(
  "*",
  cors({
    origin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.get("/health", (c) => c.json({ ok: true }));

app.route("/api/items", itemsApi);
