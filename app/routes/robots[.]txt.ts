import type { LoaderFunctionArgs } from "@remix-run/node";

import { getOrigin } from "~/shared/seo.server";

/**
 * robots.txt for crawlers and AI. Allows all, points to sitemap.
 */
export function loader({ request }: LoaderFunctionArgs) {
  const origin = getOrigin(request);
  const sitemapUrl = `${origin}/sitemap.xml`;
  const body = `User-agent: *
Allow: /

# JSON index for crawlers / AI: GET ${origin}/api/site-meta
Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
