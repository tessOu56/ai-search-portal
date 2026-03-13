#!/usr/bin/env node
/**
 * 檢查：每個 app/routes/api.* 路徑是否有對應的 MSW handler。
 * 規則：api.<name>.ts / api.<name>.$param.ts 等 → 至少有一個 handler 的 path 以 /api/<name> 開頭。
 * 見 docs/conventions/data-test-driven.md
 * Exit code: 0 if OK, 1 if missing handler.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const routesDir = path.join(root, "app", "routes");
const handlersPath = path.join(root, "app", "test", "handlers.ts");

function getApiPathPrefixes() {
  if (!fs.existsSync(routesDir)) return [];
  const files = fs.readdirSync(routesDir);
  const prefixes = new Set();
  for (const f of files) {
    if (!f.startsWith("api.") || (!f.endsWith(".ts") && !f.endsWith(".tsx")))
      continue;
    const name = f.replace(/\.(ts|tsx)$/, "");
    const parts = name.split(".");
    if (parts[0] !== "api" || parts.length < 2) continue;
    const pathName = parts.slice(1, 2).join(".");
    const prefix = `/api/${pathName}`;
    prefixes.add(prefix);
  }
  return [...prefixes];
}

function getHandlerPaths(content) {
  const matches = content.matchAll(/http\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/g);
  const paths = new Set();
  for (const m of matches) {
    if (m[2]) paths.add(m[2]);
  }
  return paths;
}

const apiPrefixes = getApiPathPrefixes();
if (apiPrefixes.length === 0) {
  console.log("lint-handlers: No api routes found, skip.");
  process.exit(0);
}

/** 尚未要求 handler 的 API 前綴（內部用或非資料契約）；目標是逐步補齊後移出此列表 */
const EXCLUDED_PREFIXES = new Set([
  "/api/chat",
  "/api/locale",
  "/api/release-notes",
  "/api/site-meta",
]);
const requiredPrefixes = apiPrefixes.filter((p) => !EXCLUDED_PREFIXES.has(p));

if (!fs.existsSync(handlersPath)) {
  console.error("lint-handlers: app/test/handlers.ts not found.");
  process.exit(1);
}

const handlersContent = fs.readFileSync(handlersPath, "utf-8");
const handlerPaths = getHandlerPaths(handlersContent);

const missing = [];
for (const prefix of requiredPrefixes) {
  const hasMatch = [...handlerPaths].some((p) => p.startsWith(prefix) || p === prefix);
  if (!hasMatch) missing.push(prefix);
}

if (missing.length > 0) {
  console.error("lint-handlers: API route(s) without MSW handler:", missing.join(", "));
  console.error("Add handlers in app/test/handlers.ts for these paths. See docs/conventions/data-test-driven.md");
  process.exit(1);
}

console.log("lint-handlers: OK");
