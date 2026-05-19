/**
 * Emit one agent-core chat stream with Langfuse enabled.
 * Prereq: docker compose up, create project keys in UI, set env (see README).
 */
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Missing ${name}. Copy labs/observability/.env.langfuse.example to .env.local.`);
    process.exit(1);
  }
  return v;
}

async function main() {
  requireEnv("LANGFUSE_HOST");
  requireEnv("LANGFUSE_PUBLIC_KEY");
  requireEnv("LANGFUSE_SECRET_KEY");

  const agentCorePath = path.join(
    repoRoot,
    "packages/agent-core/dist/index.js"
  );
  const { streamChatInternalEvents, isLangfuseEnabled } = await import(agentCorePath);

  if (!isLangfuseEnabled()) {
    console.error("Langfuse env set but isLangfuseEnabled() is false.");
    process.exit(1);
  }

  const traceId = `langfuse-smoke-${Date.now()}`;
  let eventCount = 0;
  for await (const _part of streamChatInternalEvents({
    query: "langfuse smoke trace verification",
    traceId,
    executeItemsLookup: false,
    includeRagSteps: true,
  })) {
    eventCount += 1;
  }

  const host = process.env.LANGFUSE_HOST.replace(/\/$/, "");
  console.log(`OK stream completed (events=${eventCount}, traceId=${traceId})`);
  console.log(`Open ${host} → Traces and search for trace id or query.`);
  console.log("Allow ~10s for flush before refreshing the UI.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
