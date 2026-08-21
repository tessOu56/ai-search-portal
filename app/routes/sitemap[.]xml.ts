import type { LoaderFunctionArgs } from "@remix-run/node";

import { listPublicIndexPages } from "~/shared/public-index.server";
import { getOrigin } from "~/shared/seo";

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const URLSET = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
const URLSET_END = "</urlset>";

function urlEntry(base: string, path: string, lastmod?: string): string {
  const loc = new URL(path, `${base}/`).toString();
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
  const base = getOrigin(request);
  const pages = listPublicIndexPages();
  const urls = pages.map((page) => urlEntry(base, page.path, page.lastmod));
  const body = XML_HEADER + URLSET + urls.join("") + URLSET_END;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
