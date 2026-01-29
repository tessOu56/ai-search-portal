import { readFileSync } from "node:fs";
import path from "node:path";

export type ReleaseNote = {
  version: string;
  date: string;
  summary: string;
  highlights: string[];
  commits: string[];
};

const CONTENT_DIR = "content";
const RELEASE_NOTES_FILE = "release-notes.json";

function loadReleaseNotes(): ReleaseNote[] {
  try {
    const filePath = path.join(process.cwd(), CONTENT_DIR, RELEASE_NOTES_FILE);
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item: unknown): item is ReleaseNote =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as ReleaseNote).version === "string" &&
        typeof (item as ReleaseNote).date === "string" &&
        typeof (item as ReleaseNote).summary === "string" &&
        Array.isArray((item as ReleaseNote).highlights) &&
        Array.isArray((item as ReleaseNote).commits)
    );
  } catch {
    return [];
  }
}

let cached: ReleaseNote[] | null = null;

export function getReleaseNotes(): ReleaseNote[] {
  if (cached === null) {
    cached = loadReleaseNotes();
  }
  return [...cached];
}

export function getReleaseNoteByVersion(version: string): ReleaseNote | null {
  const list = getReleaseNotes();
  const normalized = version.replace(/^v/, "");
  return list.find((r) => r.version === normalized) ?? null;
}

export function getCurrentVersion(): string {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<
      string,
      unknown
    >;
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}
