import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { getReleaseNotes } from "~/shared/release-notes.server";
import { getOrigin } from "~/shared/seo";

/**
 * GET /api/site-meta
 * JSON index for crawlers and AI: site info + public pages with title/description.
 * Use for AEO and programmatic discovery.
 */
export function loader({ request }: LoaderFunctionArgs) {
  const origin = getOrigin(request);
  const notes = getReleaseNotes();

  const site = {
    name: "Portal",
    nameZh: "Portal",
    description:
      "Ask a data catalog about access, APIs, and sources. LUI-guided answers with next steps.",
    descriptionZh: "用一句話問資料目錄、權限與 API。LUI 引導可信解答與下一步。",
    url: origin,
    sitemap: `${origin}/sitemap.xml`,
    robots: `${origin}/robots.txt`,
    locale: ["zh-TW", "en"] as const,
  };

  const pages = [
    {
      path: "/",
      title: site.name,
      titleZh: site.nameZh,
      description: site.description,
      descriptionZh: site.descriptionZh,
    },
    {
      path: "/release-notes",
      title: "Release notes",
      titleZh: "版本說明",
      description: "Version summaries and commits for users and AI context.",
      descriptionZh: "各版本更新摘要與 commits，供使用者與 AI 參考。",
    },
    ...notes.map((n) => ({
      path: `/release-notes/${n.version}`,
      title: `v${n.version}`,
      titleZh: `v${n.version}`,
      description: n.summary,
      descriptionZh: n.summary,
    })),
  ];

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
