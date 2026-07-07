import { Hono } from "hono";
import { cors } from "hono/cors";

import { contextApi } from "./routes/context.js";
import { itemsApi } from "./routes/items.js";
import { accessRequestsApi, metadataApi } from "./routes/metadata.js";

const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:5173"];
const corsOrigin = process.env.CORS_ORIGIN;
const origin =
  corsOrigin === undefined || corsOrigin === ""
    ? DEV_ORIGINS
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

app.route("/api/metadata/access-requests", accessRequestsApi);
app.route("/api/metadata", metadataApi);
app.route("/api/context", contextApi);
app.route("/api/items", itemsApi);
