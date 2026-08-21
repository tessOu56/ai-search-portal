import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { listPublicIndexPages } from "~/shared/public-index.server";
import { getOrigin } from "~/shared/seo";

/**
 * GET /api/site-meta
 * JSON index for crawlers and AI: site info + public pages with title/description.
 * Chat SSE answers are mock fixtures and are not listed as indexed content.
 */
export function loader({ request }: LoaderFunctionArgs) {
  const origin = getOrigin(request);
  const pages = listPublicIndexPages();

  const site = {
    name: "Portal",
    nameZh: "Portal",
    description:
      "Ask a data catalog about access, APIs, and sources. LUI-guided answers with next steps.",
    descriptionZh: "用一句話問資料目錄、權限與 API。LUI 引導可信解答與下一步。",
    url: origin,
    sitemap: `${origin}/sitemap.xml`,
    robots: `${origin}/robots.txt`,
    llms: `${origin}/llms.txt`,
    locale: ["zh-TW", "en"] as const,
  };

  return json(
    { site, pages },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}
