import type { LoaderFunctionArgs } from "@remix-run/node";

import { getReleaseNotes } from "~/shared/release-notes.server";

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const URLSET = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
const URLSET_END = "</urlset>";

function urlEntry(base: string, path: string, lastmod?: string): string {
  const loc = `${base}${path}`.replace(/\/+/g, "/");
  const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
  return `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}</url>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;
  const notes = getReleaseNotes();

  const urls: string[] = [
    urlEntry(base, "/"),
    urlEntry(base, "/release-notes"),
    ...notes.map((n) => urlEntry(base, `/release-notes/${n.version}`, n.date)),
  ];

  const body = XML_HEADER + URLSET + urls.join("") + URLSET_END;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
