#!/usr/bin/env node
/**
 * Lint file and folder names under app/ per docs/CONVENTIONS.md.
 * - Folders (except under app/routes): lowercase letters and numbers only, no separator.
 * - Component .tsx under app/components: filename must be PascalCase (or index.ts).
 *   Co-located tests: ComponentName.test.tsx / ComponentName.spec.tsx (base name PascalCase).
 * Exit code: 0 if OK, 1 if violations.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const appDir = path.join(root, "app");

const FOLDER_REGEX = /^[a-z][a-z0-9]*$/;
const PASCAL_REGEX = /^[A-Z][a-zA-Z0-9]*$/;
const COMPONENT_TEST_SUFFIXES = [".test.tsx", ".spec.tsx"];

function componentTsxBaseName(fileName) {
  for (const suffix of COMPONENT_TEST_SUFFIXES) {
    if (fileName.endsWith(suffix)) {
      return fileName.slice(0, -suffix.length);
    }
  }
  if (fileName.endsWith(".tsx")) {
    return fileName.slice(0, -4);
  }
  return null;
}

const violations = [];

function walk(dir, relativeDir = "app", skipFolderCheck = false) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const ent of entries) {
    const rel = path.join(relativeDir, ent.name);

    if (ent.isDirectory()) {
      const isUnderRoutes =
        relativeDir === "app" && ent.name === "routes" ||
        relativeDir.startsWith("app/routes");
      const skipChildFolderCheck = skipFolderCheck || isUnderRoutes;
      if (!skipChildFolderCheck && !FOLDER_REGEX.test(ent.name)) {
        violations.push({
          path: rel,
          rule: "folder",
          message: `Folder name must be lowercase letters/numbers only (no hyphen/underscore): "${ent.name}"`,
        });
      }
      walk(path.join(dir, ent.name), rel, skipChildFolderCheck);
      continue;
    }

    if (ent.isFile() && relativeDir.startsWith("app/components") && ent.name.endsWith(".tsx")) {
      const base = componentTsxBaseName(ent.name);
      if (base !== null && base !== "index" && !PASCAL_REGEX.test(base)) {
        violations.push({
          path: rel,
          rule: "component",
          message: `Component file under app/components must be PascalCase: "${ent.name}"`,
        });
      }
    }
  }
}

walk(appDir);

if (violations.length === 0) {
  console.log("lint-filenames: OK");
  process.exit(0);
}

console.error("lint-filenames: violations (see docs/CONVENTIONS.md)\n");
for (const v of violations) {
  const normalizedPath = v.path.split(path.sep).join("/");
  console.error(`  ${normalizedPath}`);
  console.error(`    ${v.message}\n`);
}
process.exit(1);
