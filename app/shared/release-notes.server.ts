import releaseNotesData from "../../content/release-notes.json";
import appPackage from "../../package.json";

export type ReleaseNote = {
  version: string;
  date: string;
  summary: string;
  highlights: string[];
  commits: string[];
};

function parseReleaseNotes(data: unknown): ReleaseNote[] {
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
}

let cached: ReleaseNote[] | null = null;

export function getReleaseNotes(): ReleaseNote[] {
  if (cached === null) {
    cached = parseReleaseNotes(releaseNotesData);
  }
  return [...cached];
}

export function getReleaseNoteByVersion(version: string): ReleaseNote | null {
  const list = getReleaseNotes();
  const normalized = version.replace(/^v/, "");
  return list.find((r) => r.version === normalized) ?? null;
}

export function getCurrentVersion(): string {
  const version = appPackage.version;
  return typeof version === "string" ? version : "0.0.0";
}
