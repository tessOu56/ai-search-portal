/**
 * Visitor experience destinations for Overview chrome.
 * Product planning ledger lives in platform-command (planning/projects/).
 * Do not list /new, :id placeholders, or /site-map.
 */

export type ExperienceNavSectionId =
  "primary" | "governance" | "catalogs" | "support";

export type ExperienceNavEntry = {
  href: string;
  label: string;
  section: ExperienceNavSectionId;
};

export const EXPERIENCE_NAV_SECTIONS: Array<{
  id: ExperienceNavSectionId;
  title: string;
}> = [
  { id: "primary", title: "Primary journeys" },
  { id: "governance", title: "Governance demo" },
  { id: "catalogs", title: "Seeded catalogs" },
  { id: "support", title: "Support" },
];

export const EXPERIENCE_NAV: ExperienceNavEntry[] = [
  { href: "/?view=dashboard", label: "Overview", section: "primary" },
  { href: "/catalog-search", label: "Catalog search", section: "primary" },
  {
    href: "/catalog-search/dictionary",
    label: "Catalog dictionary",
    section: "primary",
  },
  { href: "/metadata", label: "Metadata catalog", section: "primary" },
  {
    href: "/access-requests/review?sessionRole=owner",
    label: "Access review",
    section: "governance",
  },
  {
    href: "/my-apis?sessionRole=requester",
    label: "My APIs",
    section: "governance",
  },
  { href: "/insights", label: "Insights", section: "catalogs" },
  { href: "/items", label: "Items", section: "catalogs" },
  { href: "/dishes", label: "Dishes", section: "catalogs" },
  { href: "/recipes", label: "Recipes", section: "catalogs" },
  { href: "/vitals", label: "Web Vitals", section: "support" },
  { href: "/release-notes", label: "Release notes", section: "support" },
];

export const PRODUCT_TABLE_LINK_CLASS =
  "font-medium text-foreground underline-offset-4 hover:underline";

function navPathname(href: string): string {
  return new URL(href, "http://portal.local").pathname;
}

export function experienceNavIsActive(
  entry: ExperienceNavEntry,
  pathname: string,
  searchParams: { get: (key: string) => string | null }
): boolean {
  const url = new URL(entry.href, "http://portal.local");

  if (url.pathname === "/" && url.searchParams.get("view")) {
    const view = searchParams.get("view");
    return pathname === "/" && (view === "dashboard" || view === "saas");
  }

  const matching = EXPERIENCE_NAV.filter((candidate) => {
    const candidatePath = navPathname(candidate.href);
    if (candidatePath === "/") return false;
    return (
      pathname === candidatePath || pathname.startsWith(`${candidatePath}/`)
    );
  });

  matching.sort(
    (a, b) => navPathname(b.href).length - navPathname(a.href).length
  );

  return matching[0]?.href === entry.href;
}
