/**
 * Human UX sitemap — inspection ledger for /site-map.
 * Add a row here when adding a human-facing route (not /api/*, not sitemap.xml).
 * Home / dashboard stay marketing; they are listed so the map can orient.
 */

export type UxSection = "primary" | "governance" | "lab" | "support";
export type UxGrade = "ok" | "needs-sdk" | "lab-thin";

export type UxSitemapEntry = {
  /** Display path (may include :param or query). */
  path: string;
  /** Click target when `path` is a pattern. Defaults to `path`. */
  href?: string;
  label: string;
  section: UxSection;
  ux: UxGrade;
  /** SDK components that actually compose the screen (not “imported Card once”). */
  sdk: string[];
  note?: string;
  /** Remix route module under app/routes (for inventory tests). */
  routeFile: string;
};

export const UX_SITEMAP: UxSitemapEntry[] = [
  {
    path: "/",
    label: "Home / Ask",
    section: "primary",
    ux: "ok",
    sdk: ["BrandMark", "Container", "Button"],
    note: "Marketing surface — BrandMark + atmosphere. Do not restyle as a tool page.",
    routeFile: "app/routes/_index.tsx",
  },
  {
    path: "/?view=dashboard",
    href: "/?view=dashboard",
    label: "Overview",
    section: "primary",
    ux: "ok",
    sdk: ["Container", "Button"],
    note: "Workspace dashboard; same home route.",
    routeFile: "app/routes/_index.tsx",
  },
  {
    path: "/catalog-search",
    label: "Catalog search",
    section: "primary",
    ux: "ok",
    sdk: [
      "Container",
      "Stack",
      "DataTable",
      "EmptyState",
      "Skeleton",
      "StatusChip",
    ],
    note: "Journey C start. Product shell; results are SDK DataTable.",
    routeFile: "app/routes/catalog-search._index.tsx",
  },
  {
    path: "/catalog-search/dictionary",
    label: "Catalog dictionary",
    section: "primary",
    ux: "ok",
    sdk: ["Container", "Stack", "EmptyState", "Panel"],
    note: "Virtualized 10k list; row chrome aligned with DataTable.",
    routeFile: "app/routes/catalog-search.dictionary.tsx",
  },
  {
    path: "/metadata",
    label: "Metadata catalog",
    section: "primary",
    ux: "ok",
    sdk: [
      "Container",
      "Stack",
      "DataTable",
      "EmptyState",
      "Skeleton",
      "StatusChip",
    ],
    note: "Context-pack search; results are SDK DataTable.",
    routeFile: "app/routes/metadata._index.tsx",
  },
  {
    path: "/metadata/:id",
    href: "/metadata/tbl-customers?purpose=marketing&role=analyst",
    label: "Metadata detail (Journey C)",
    section: "primary",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel", "FormField", "Skeleton"],
    note: "Example asset tbl-customers. Loading uses SDK Skeleton.",
    routeFile: "app/routes/metadata.$assetId.tsx",
  },
  {
    path: "/access-requests/review",
    href: "/access-requests/review?sessionRole=owner",
    label: "Access review (owner)",
    section: "governance",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel", "Skeleton"],
    note: "Showcase persona via ?sessionRole= — not IdP.",
    routeFile: "app/routes/access-requests.review.tsx",
  },
  {
    path: "/my-apis",
    href: "/my-apis?sessionRole=requester",
    label: "My APIs (requester)",
    section: "governance",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel", "Skeleton"],
    note: "Showcase persona via ?sessionRole= — not IdP.",
    routeFile: "app/routes/my-apis._index.tsx",
  },
  {
    path: "/insights",
    label: "Insights",
    section: "lab",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel"],
    note: "Chart POC; product shell only.",
    routeFile: "app/routes/insights._index.tsx",
  },
  {
    path: "/items",
    label: "Items",
    section: "lab",
    ux: "ok",
    sdk: ["Container", "Stack", "DataTable", "EmptyState", "Button"],
    note: "Lab CRUD list.",
    routeFile: "app/routes/items._index.tsx",
  },
  {
    path: "/items/new",
    label: "New item",
    section: "lab",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel", "FormField"],
    routeFile: "app/routes/items.new.tsx",
  },
  {
    path: "/items/:id",
    href: "/items/1",
    label: "Item detail",
    section: "lab",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel", "FormField"],
    note: "Example seed id 1.",
    routeFile: "app/routes/items.$itemId.tsx",
  },
  {
    path: "/dishes",
    label: "Dishes",
    section: "lab",
    ux: "ok",
    sdk: ["Container", "Stack", "DataTable", "EmptyState"],
    note: "Loader seed; no public REST.",
    routeFile: "app/routes/dishes._index.tsx",
  },
  {
    path: "/dishes/:id",
    href: "/dishes/dish-three-cup-chicken",
    label: "Dish detail",
    section: "lab",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel", "EmptyState"],
    note: "Stable seed id dish-three-cup-chicken.",
    routeFile: "app/routes/dishes.$dishId.tsx",
  },
  {
    path: "/recipes",
    label: "Recipes",
    section: "lab",
    ux: "ok",
    sdk: ["Container", "Stack", "DataTable", "EmptyState"],
    note: "Loader seed; no public REST.",
    routeFile: "app/routes/recipes._index.tsx",
  },
  {
    path: "/recipes/:id",
    href: "/recipes",
    label: "Recipe detail",
    section: "lab",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel"],
    note: "Open a row from the list (seed ids are not stable).",
    routeFile: "app/routes/recipes.$recipeId.tsx",
  },
  {
    path: "/vitals",
    label: "Web Vitals",
    section: "support",
    ux: "ok",
    sdk: ["Container", "Stack", "Grid", "Metric", "StatusChip"],
    note: "Browser-session metrics only.",
    routeFile: "app/routes/vitals.tsx",
  },
  {
    path: "/release-notes",
    label: "Release notes",
    section: "support",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel", "EmptyState"],
    routeFile: "app/routes/release-notes._index.tsx",
  },
  {
    path: "/release-notes/:version",
    href: "/release-notes/1.0.0",
    label: "Release note version",
    section: "support",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel"],
    note: "Example v1.0.0.",
    routeFile: "app/routes/release-notes.$version.tsx",
  },
  {
    path: "/site-map",
    label: "Site map (this page)",
    section: "support",
    ux: "ok",
    sdk: ["Container", "Stack", "Panel", "StatusChip"],
    note: "UX inspection ledger. Machine SEO is /sitemap.xml.",
    routeFile: "app/routes/site-map.tsx",
  },
];

export const UX_SITEMAP_SECTIONS: Array<{
  id: UxSection;
  title: string;
  note?: string;
}> = [
  { id: "primary", title: "Primary journeys" },
  {
    id: "governance",
    title: "Governance demo",
    note: "Uses ?sessionRole= showcase personas — not production auth.",
  },
  { id: "lab", title: "Secondary / lab" },
  { id: "support", title: "Support" },
];

export function uxSitemapHref(entry: UxSitemapEntry): string {
  return entry.href ?? entry.path;
}
