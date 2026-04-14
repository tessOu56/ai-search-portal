import { serve } from "@hono/node-server";

import { app } from "./app.js";

const port = Number(process.env.AGENT_PORT ?? 3002);

serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console -- process startup banner (mirrors backend)
  console.info(`agent-runtime listening on http://localhost:${info.port}`);
});
