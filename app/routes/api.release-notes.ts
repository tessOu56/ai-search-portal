import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import {
  getReleaseNoteByVersion,
  getReleaseNotes,
} from "~/shared/release-notes.server";

/**
 * GET /api/release-notes
 * Returns all release notes as JSON for AI context or external consumers.
 * GET /api/release-notes?version=1.0.0 returns a single version.
 */
export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const version = url.searchParams.get("version");

  if (version) {
    const note = getReleaseNoteByVersion(version);
    if (!note) {
      return json({ error: "Not found", version }, { status: 404 });
    }
    return json(note, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const notes = getReleaseNotes();
  return json(
    { releases: notes },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}
