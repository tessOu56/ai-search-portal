#!/usr/bin/env node
/**
 * Fail if `vercel build` / vercelPreset did not emit a server function
 * that can serve `/`. Platform NOT_FOUND on every route is the symptom.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  process.env.CHECK_VERCEL_OUTPUT_ROOT ??
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
);
const outputDir = path.join(root, ".vercel", "output");
const configPath = path.join(outputDir, "config.json");
const functionsDir = path.join(outputDir, "functions");
const resultPath = path.join(root, ".vercel", "react-router-build-result.json");

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(resultPath) && !existsSync(configPath)) {
  fail(
    "Missing .vercel/react-router-build-result.json and .vercel/output/config.json. vercelPreset did not run or the Remix builder discarded the React Router output."
  );
}

if (existsSync(resultPath)) {
  const result = JSON.parse(readFileSync(resultPath, "utf8"));
  const routeCount = Object.keys(result.buildManifest?.routes ?? {}).length;
  if (routeCount === 0) {
    fail("react-router-build-result.json has no routes.");
  }
  console.log(`vercelPreset result: ${routeCount} routes`);
}

if (!existsSync(configPath)) {
  fail(
    "Missing .vercel/output/config.json. Vercel did not wrap the React Router build as Build Output API (Framework Preset is likely still Remix)."
  );
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const routes = Array.isArray(config.routes) ? config.routes : [];
const hasFunctionDest = routes.some((route) => {
  const dest = typeof route.dest === "string" ? route.dest : "";
  const src = typeof route.src === "string" ? route.src : "";
  return dest.length > 0 && (src.includes(".*") || src === "/(.*)" || src === "/");
});

const functionEntries = existsSync(functionsDir)
  ? readdirSync(functionsDir, { withFileTypes: true }).filter((entry) =>
      entry.name.endsWith(".func")
    )
  : [];

if (functionEntries.length === 0 && !hasFunctionDest) {
  fail(
    "Vercel output has no serverless function for `/`. This deploy would 404 every SSR route."
  );
}

console.log(
  `Vercel output OK (${functionEntries.length} functions, ${routes.length} routes)`
);
