import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

import { Container } from "~/components/ui/Container";

export const meta: MetaFunction = () => [
  { title: "Site map | AI Search Portal" },
  {
    name: "description",
    content:
      "Human-readable map of primary Portal journeys — showcase / integrated demo.",
  },
];

const SECTIONS: Array<{
  title: string;
  note?: string;
  links: Array<{ to: string; label: string }>;
}> = [
  {
    title: "Primary journeys",
    links: [
      { to: "/", label: "Home / LUI chat" },
      { to: "/?view=dashboard", label: "Dashboard overview" },
      { to: "/catalog-search", label: "Catalog search" },
      { to: "/catalog-search/dictionary", label: "Catalog dictionary" },
      { to: "/metadata", label: "Metadata catalog" },
      { to: "/vitals", label: "Web Vitals" },
    ],
  },
  {
    title: "Governance demo (not production auth)",
    note: "Uses ?sessionRole= showcase personas — not IdP.",
    links: [
      {
        to: "/access-requests/review?sessionRole=owner",
        label: "Access review (owner)",
      },
      {
        to: "/my-apis?sessionRole=requester",
        label: "My APIs (requester)",
      },
    ],
  },
  {
    title: "Secondary / lab",
    links: [
      { to: "/insights", label: "Insights" },
      { to: "/items", label: "Items" },
      { to: "/dishes", label: "Dishes" },
      { to: "/recipes", label: "Recipes" },
      { to: "/release-notes", label: "Release notes" },
    ],
  },
];

export default function SiteMapPage() {
  return (
    <div className="min-h-dvh bg-background py-10">
      <Container className="max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            AI Search Portal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Site map
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Orient to primary journeys. Machine SEO remains{" "}
            <code className="text-xs">/sitemap.xml</code> (narrow keep-list).
            Showcase risks stay labelled on demo routes.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              className="bg-card/60 rounded-xl border border-border p-4"
            >
              <h2 className="text-sm font-semibold text-foreground">
                {section.title}{" "}
                <span className="font-normal text-muted-foreground">
                  ({section.links.length})
                </span>
              </h2>
              {section.note ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {section.note}
                </p>
              ) : null}
              <ul className="mt-3 space-y-1.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-primary hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          <Link to="/" className="text-primary hover:underline">
            ← Home
          </Link>
        </p>
      </Container>
    </div>
  );
}
