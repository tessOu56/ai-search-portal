#!/usr/bin/env node
/**
 * Run OPA policy tests when `opa` CLI is available.
 * Skips gracefully in environments without OPA installed.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const policiesDir = path.join(root, "specs", "policies");

const which = spawnSync("opa", ["version"], { encoding: "utf-8" });
if (which.error || which.status !== 0) {
  console.log("test:policies: OPA CLI not found — skip (install opa or use labs/opa)");
  process.exit(0);
}

const result = spawnSync("opa", ["test", policiesDir], {
  cwd: root,
  encoding: "utf-8",
  stdio: "inherit",
});

process.exit(result.status === 0 ? 0 : 1);
