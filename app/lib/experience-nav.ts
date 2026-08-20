/**
 * Visitor experience destinations for Overview chrome.
 * Product planning ledger lives in platform-command (planning/projects/).
 * Labels are i18n keys — do not hardcode visitor copy here.
 * Do not list /new, :id placeholders, or /site-map.
 */

export type ExperienceNavSectionId =
  "primary" | "governance" | "catalogs" | "support";

export type ExperienceNavEntry = {
  href: string;
  labelKey: string;
  section: ExperienceNavSectionId;
};

export const EXPERIENCE_NAV_SECTIONS: Array<{
  id: ExperienceNavSectionId;
  titleKey: string;
}> = [
  { id: "primary", titleKey: "nav.section.primary" },
  { id: "governance", titleKey: "nav.section.governance" },
  { id: "catalogs", titleKey: "nav.section.catalogs" },
  { id: "support", titleKey: "nav.section.support" },
];

export const EXPERIENCE_NAV: ExperienceNavEntry[] = [
  { href: "/?view=dashboard", labelKey: "nav.overview", section: "primary" },
  {
    href: "/catalog-search",
    labelKey: "nav.catalog-search",
    section: "primary",
  },
  {
    href: "/catalog-search/dictionary",
    labelKey: "nav.catalog-dictionary",
    section: "primary",
  },
  { href: "/metadata", labelKey: "nav.metadata", section: "primary" },
  {
    href: "/access-requests/review?sessionRole=owner",
    labelKey: "nav.access-review",
    section: "governance",
  },
  {
    href: "/my-apis?sessionRole=requester",
    labelKey: "nav.my-requests",
    section: "governance",
  },
  { href: "/items", labelKey: "nav.items", section: "catalogs" },
  { href: "/dishes", labelKey: "nav.dishes", section: "catalogs" },
  { href: "/recipes", labelKey: "nav.recipes", section: "catalogs" },
  { href: "/insights", labelKey: "nav.insights", section: "support" },
  { href: "/vitals", labelKey: "nav.vitals", section: "support" },
  { href: "/release-notes", labelKey: "nav.release-notes", section: "support" },
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
