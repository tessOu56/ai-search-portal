import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type LiveSurfaceDoc = {
  reservedRestNotLive: string[];
  remixBffPaths: string[];
  openapiPaths: string[];
  honoPaths: string[];
  drift: {
    bffNotInOpenApi: string[];
    openApiNotInBff: string[];
    openApiNotInHono: string[];
    honoNotInOpenApi: string[];
  };
};

const ROOT = process.cwd();

function sorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

function minus(left: string[], right: string[]): string[] {
  const skip = new Set(right);
  return sorted(left.filter((path) => !skip.has(path)));
}

function remixApiFileToPath(filename: string): string | null {
  if (!filename.startsWith("api.") || !/\.(ts|tsx)$/.test(filename)) {
    return null;
  }
  const name = filename.replace(/\.(ts|tsx)$/, "");
  const parts = name.split(".");
  if (parts[0] !== "api" || parts.length < 2) return null;
  const segs = parts
    .slice(1)
    .map((part) => (part.startsWith("$") ? `{${part.slice(1)}}` : part));
  return `/api/${segs.join("/")}`;
}

function discoverRemixBffPaths(): string[] {
  const files = readdirSync(join(ROOT, "app/routes"));
  const paths: string[] = [];
  for (const file of files) {
    const mapped = remixApiFileToPath(file);
    if (mapped) paths.push(mapped);
  }
  return sorted(paths);
}

function discoverOpenApiPaths(): string[] {
  const doc = parse(
    readFileSync(join(ROOT, "specs/openapi/openapi.yaml"), "utf8")
  ) as { paths?: Record<string, unknown> };
  return sorted(Object.keys(doc.paths ?? {}));
}

function honoParam(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function joinMount(prefix: string, routePath: string): string {
  if (routePath === "/" || routePath === "") return prefix;
  const suffix = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${prefix}${suffix}`.replace(/\/{2,}/g, "/");
}

function methodPathsInSource(source: string): string[] {
  const matches = source.matchAll(
    /\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g
  );
  return [...matches].map((match) => match[2]);
}

function sliceExport(source: string, exportName: string): string {
  const start = source.indexOf(`export const ${exportName}`);
  if (start < 0) return "";
  const rest = source.slice(start + `export const ${exportName}`.length);
  const next = rest.search(/\nexport const /);
  return next < 0 ? rest : rest.slice(0, next);
}

function discoverHonoPaths(): string[] {
  const paths = new Set<string>();
  const appSrc = readFileSync(join(ROOT, "backend/src/app.ts"), "utf8");
  for (const match of appSrc.matchAll(/app\.get\(\s*"([^"]+)"/g)) {
    paths.add(honoParam(match[1]));
  }

  const mounts: Array<{ file: string; exportName: string; prefix: string }> = [
    {
      file: "backend/src/routes/context.ts",
      exportName: "contextApi",
      prefix: "/api/context",
    },
    {
      file: "backend/src/routes/items.ts",
      exportName: "itemsApi",
      prefix: "/api/items",
    },
    {
      file: "backend/src/routes/metadata.ts",
      exportName: "metadataApi",
      prefix: "/api/metadata",
    },
    {
      file: "backend/src/routes/metadata.ts",
      exportName: "accessRequestsApi",
      prefix: "/api/metadata/access-requests",
    },
  ];

  for (const mount of mounts) {
    const source = readFileSync(join(ROOT, mount.file), "utf8");
    const slice = sliceExport(source, mount.exportName) || source;
    for (const routePath of methodPathsInSource(slice)) {
      paths.add(honoParam(joinMount(mount.prefix, routePath)));
    }
  }
  return sorted(paths);
}

function loadDoc(): LiveSurfaceDoc {
  return parse(
    readFileSync(join(ROOT, "specs/api/live-surface.yaml"), "utf8")
  ) as LiveSurfaceDoc;
}

describe("LIVE surface drift (T-2026-247)", () => {
  const doc = loadDoc();

  it("does not ship dishes/recipes/ingredients/vendors REST routes", () => {
    const reservedFiles = [
      "app/routes/api.dishes.ts",
      "app/routes/api.dishes.$dishId.ts",
      "app/routes/api.recipes.ts",
      "app/routes/api.recipes.$recipeId.ts",
      "app/routes/api.ingredients.ts",
      "app/routes/api.vendors.ts",
    ];
    for (const file of reservedFiles) {
      expect(existsSync(join(ROOT, file)), file).toBe(false);
    }
    const remix = discoverRemixBffPaths();
    for (const path of doc.reservedRestNotLive) {
      expect(remix.includes(path), path).toBe(false);
    }
  });

  it("Remix BFF paths match the documented LIVE set", () => {
    expect(discoverRemixBffPaths()).toEqual(sorted(doc.remixBffPaths));
  });

  it("OpenAPI paths match the documented set", () => {
    expect(discoverOpenApiPaths()).toEqual(sorted(doc.openapiPaths));
  });

  it("Hono paths match the documented reference set", () => {
    expect(discoverHonoPaths()).toEqual(sorted(doc.honoPaths));
  });

  it("documented drift equals the actual BFF vs OpenAPI vs Hono diff", () => {
    const remix = discoverRemixBffPaths();
    const openapi = discoverOpenApiPaths();
    const hono = discoverHonoPaths();
    expect(minus(remix, openapi)).toEqual(sorted(doc.drift.bffNotInOpenApi));
    expect(minus(openapi, remix)).toEqual(sorted(doc.drift.openApiNotInBff));
    expect(minus(openapi, hono)).toEqual(sorted(doc.drift.openApiNotInHono));
    expect(minus(hono, openapi)).toEqual(sorted(doc.drift.honoNotInOpenApi));
  });
});
