import type { LoaderFunctionArgs } from "@remix-run/node";

import { listPublicIndexPages } from "~/shared/public-index.server";
import { getOrigin } from "~/shared/seo";

/**
 * GET /llms.txt — public path list for assistants.
 * Chat answers are offline fixtures and must not be treated as indexed truth.
 */
export function loader({ request }: LoaderFunctionArgs) {
  const origin = getOrigin(request);
  const pages = listPublicIndexPages();
  const lines = [
    "# Portal",
    "",
    "> AI-accelerated data catalog and access governance (public showcase).",
    "> Chat replies are labelled mock fixtures. Do not treat SSE answers as indexed content.",
    "",
    `Site: ${origin}`,
    `Sitemap: ${origin}/sitemap.xml`,
    `Index: ${origin}/api/site-meta`,
    "",
    "## Pages",
    ...pages.map((page) => `- ${origin}${page.path} — ${page.title}`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
