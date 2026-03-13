#!/usr/bin/env node
/**
 * Code review governance: scan for TODO(CR-xxx) in app/, cross-check with code-review/issues.md.
 * Output: CR TODO list + missing / orphan consistency check. Never fails build (exit 0).
 * See code-review/README.md.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const appDir = path.join(root, "app");
const issuesPath = path.join(root, "code-review", "issues.md");

const CR_TODO_REGEX = /TODO\((CR-\d{3,})\):\s*(.+)/;

function* walkTsFiles(dir, relativeDir = "app") {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const rel = path.join(relativeDir, ent.name);
    if (ent.isDirectory()) {
      yield* walkTsFiles(path.join(dir, ent.name), rel);
      continue;
    }
    if (ent.isFile() && (ent.name.endsWith(".ts") || ent.name.endsWith(".tsx"))) {
      yield { absolute: path.join(dir, ent.name), relative: rel.split(path.sep).join("/") };
    }
  }
}

function scanCodeForCrTodos() {
  const todos = [];
  for (const { absolute, relative } of walkTsFiles(appDir)) {
    const content = fs.readFileSync(absolute, "utf-8");
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(CR_TODO_REGEX);
      if (match) {
        todos.push({
          id: match[1],
          file: relative,
          line: i + 1,
          text: match[2].trim(),
        });
      }
    }
  }
  return todos;
}

function parseIssuesMd() {
  if (!fs.existsSync(issuesPath)) return { openIds: new Set(), allIds: new Set(), expectsTodo: new Set() };
  const content = fs.readFileSync(issuesPath, "utf-8");
  const lines = content.split(/\r?\n/);
  const openIds = new Set();
  const allIds = new Set();
  const expectsTodo = new Set(); // open and file(s) !== "multiple"
  for (const line of lines) {
    if (!line.startsWith("|") || line.startsWith("| id") || line.startsWith("|---")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 5) continue;
    const id = cells[0];
    const files = cells[2] ?? "";
    const status = cells[4] ?? "";
    allIds.add(id);
    if (status.toLowerCase() === "open") {
      openIds.add(id);
      if (files.toLowerCase() !== "multiple") expectsTodo.add(id);
    }
  }
  return { openIds, allIds, expectsTodo };
}

function main() {
  const todos = scanCodeForCrTodos();
  const { allIds, expectsTodo } = parseIssuesMd();
  const foundIds = new Set(todos.map((t) => t.id));
  const missing = [...expectsTodo].filter((id) => !foundIds.has(id)).sort();
  const orphan = [...foundIds].filter((id) => !allIds.has(id)).sort();

  console.log("CR TODO LIST\n");
  const byId = new Map();
  for (const t of todos) {
    if (!byId.has(t.id)) byId.set(t.id, []);
    byId.get(t.id).push(t);
  }
  for (const id of [...byId.keys()].sort()) {
    for (const t of byId.get(id)) {
      console.log(`${id}  ${t.file}:${t.line}`);
      console.log(`  ${t.text}\n`);
    }
  }

  console.log("Code Review Consistency Check\n");
  console.log("missing TODO");
  if (missing.length === 0) console.log("  (none)\n");
  else missing.forEach((id) => console.log(`  ${id}`));
  console.log("");
  console.log("orphan TODO");
  if (orphan.length === 0) console.log("  (none)\n");
  else orphan.forEach((id) => console.log(`  ${id}`));
}

main();
process.exit(0);
