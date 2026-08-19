import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

import {
  ProductPageHeader,
  ProductPageShell,
} from "~/components/shared/product/ProductPageShell";
import { Panel } from "~/components/ui/Panel";
import { StatusChip } from "~/components/ui/StatusChip";
import {
  UX_SITEMAP,
  UX_SITEMAP_SECTIONS,
  type UxGrade,
  uxSitemapHref,
} from "~/lib/ux-sitemap";

export const meta: MetaFunction = () => [
  { title: "Site map | AI Search Portal" },
  {
    name: "description",
    content:
      "Living UX inspection map of Portal journeys — grades and SDK usage per screen.",
  },
];

function gradeChip(ux: UxGrade): {
  status: "success" | "warning" | "info";
  label: string;
} {
  if (ux === "ok") return { status: "success", label: "ok" };
  if (ux === "needs-sdk") return { status: "warning", label: "needs SDK" };
  return { status: "info", label: "lab-thin" };
}

export default function SiteMapPage() {
  return (
    <ProductPageShell current="Site map">
      <ProductPageHeader
        title="Site map"
        description={
          <>
            UX inspection ledger for every human path (including nested
            screens). Machine SEO stays at{" "}
            <code className="text-type-14">/sitemap.xml</code>.
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2" data-testid="ux-sitemap">
        {UX_SITEMAP_SECTIONS.map((section) => {
          const links = UX_SITEMAP.filter(
            (entry) => entry.section === section.id
          );
          return (
            <Panel key={section.id}>
              <section>
                <h2 className="text-type-16 font-semibold text-foreground">
                  {section.title}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({links.length})
                  </span>
                </h2>
                {section.note ? (
                  <p className="mt-1 text-type-14 text-muted-foreground">
                    {section.note}
                  </p>
                ) : null}
                <ul className="mt-3 space-y-3">
                  {links.map((entry) => {
                    const grade = gradeChip(entry.ux);
                    return (
                      <li key={entry.path} className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={uxSitemapHref(entry)}
                            className="text-type-14 font-medium text-primary hover:underline"
                          >
                            {entry.label}
                          </Link>
                          <StatusChip
                            status={grade.status}
                            data-ux-grade={entry.ux}
                          >
                            {grade.label}
                          </StatusChip>
                        </div>
                        <p className="font-mono text-type-14 text-muted-foreground">
                          {entry.path}
                        </p>
                        {entry.sdk.length > 0 ? (
                          <p className="text-type-14 text-muted-foreground">
                            SDK: {entry.sdk.join(", ")}
                          </p>
                        ) : null}
                        {entry.note ? (
                          <p className="text-type-14 text-muted-foreground">
                            {entry.note}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </Panel>
          );
        })}
      </div>
    </ProductPageShell>
  );
}
