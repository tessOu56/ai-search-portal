import { listAllMetadataSummaries } from "~/services/metadata.server";
import { getReleaseNotes } from "~/shared/release-notes.server";

export type PublicIndexPage = {
  path: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  lastmod?: string;
};

/**
 * Crawler / AEO index of public product pages.
 * Chat answers are mock fixtures and are not listed as indexed content.
 */
export function listPublicIndexPages(): PublicIndexPage[] {
  const notes = getReleaseNotes();
  const assets = listAllMetadataSummaries();

  const staticPages: PublicIndexPage[] = [
    {
      path: "/",
      title: "Portal",
      titleZh: "Portal",
      description:
        "Ask a data catalog about access, APIs, and sources. LUI-guided answers with next steps.",
      descriptionZh:
        "用一句話問資料目錄、權限與 API。LUI 引導可信解答與下一步。",
    },
    {
      path: "/developers",
      title: "Developer Hub",
      titleZh: "Developer Hub",
      description:
        "Read-only API explorer with sandbox try-it for the Portal demo.",
      descriptionZh: "唯讀 API 探索與 sandbox try-it（示範用）。",
    },
    {
      path: "/catalog-search",
      title: "Catalog search",
      titleZh: "目錄搜尋",
      description:
        "Filter APIs and tables, then open an asset to request access.",
      descriptionZh: "篩選 API 與資料表，再開資產申請權限。",
    },
    {
      path: "/metadata",
      title: "Data assets",
      titleZh: "資料資產",
      description:
        "Policy-driven asset list with owner, classification, and lineage.",
      descriptionZh: "帶 owner、分類與血緣的資料資產清單。",
    },
    {
      path: "/release-notes",
      title: "Release notes",
      titleZh: "版本說明",
      description: "Version summaries and commits for users and AI context.",
      descriptionZh: "各版本更新摘要與 commits，供使用者與 AI 參考。",
    },
  ];

  const notePages: PublicIndexPage[] = notes.map((n) => ({
    path: `/release-notes/${n.version}`,
    title: `v${n.version}`,
    titleZh: `v${n.version}`,
    description: n.summary,
    descriptionZh: n.summary,
    lastmod: n.date,
  }));

  const assetPages: PublicIndexPage[] = assets.map((asset) => ({
    path: `/metadata/${asset.id}`,
    title: asset.name,
    titleZh: asset.name,
    description: asset.description,
    descriptionZh: asset.description,
    lastmod: asset.updatedAt,
  }));

  return [...staticPages, ...notePages, ...assetPages];
}
