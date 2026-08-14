import { Link } from "@remix-run/react";

import { Button } from "~/components/ui/Button";
import { useI18n } from "~/shared/i18n/context";

import { WorkspaceFooter } from "./WorkspaceFooter";

const QUERIES = [
  {
    title: "overview.pii.title",
    desc: "overview.pii.desc",
    question: "home.composer.suggest.1",
    browseTo: "/metadata",
  },
  {
    title: "overview.lineage.title",
    desc: "overview.lineage.desc",
    question: "home.composer.suggest.2",
    browseTo: "/metadata",
  },
  {
    title: "overview.orders.title",
    desc: "overview.orders.desc",
    question: "home.composer.suggest.3",
    browseTo: "/catalog-search",
  },
] as const;

/**
 * Overview — visitor map of business queries (auxiliary path, interface-roadmap).
 * Surface: product.
 */
export function DashboardView() {
  const { t } = useI18n();

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1">
        <section
          className="mx-auto w-full max-w-5xl px-space-16 py-section md:px-space-32"
          aria-labelledby="overview-title"
        >
          <h1
            id="overview-title"
            className="mb-space-8 font-display text-type-32 font-medium text-foreground md:text-type-52"
          >
            {t("overview.title")}
          </h1>
          <p className="max-w-xl text-type-16 leading-body text-muted-foreground">
            {t("overview.desc")}
          </p>
        </section>

        {QUERIES.map((item) => {
          const question = t(item.question);
          return (
            <section
              key={item.title}
              className="mx-auto w-full max-w-5xl px-space-16 pb-section md:px-space-32"
              aria-labelledby={item.title}
            >
              <h2
                id={item.title}
                className="mb-space-8 font-display text-type-32 font-medium text-foreground"
              >
                {t(item.title)}
              </h2>
              <p className="mb-space-16 max-w-xl text-type-16 leading-body text-muted-foreground">
                {t(item.desc)}
              </p>
              <div className="flex flex-wrap gap-space-8">
                <Button asChild size="sm">
                  <Link to={`/?q=${encodeURIComponent(question)}`}>
                    {t("overview.ask")}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to={item.browseTo}>{t("overview.browse")}</Link>
                </Button>
              </div>
            </section>
          );
        })}

        <section
          className="mx-auto w-full max-w-5xl px-space-16 pb-section md:px-space-32"
          aria-labelledby="overview-browse"
        >
          <h2
            id="overview-browse"
            className="mb-space-8 font-display text-type-32 font-medium text-foreground"
          >
            {t("overview.browse.title")}
          </h2>
          <p className="mb-space-16 max-w-xl text-type-16 leading-body text-muted-foreground">
            {t("overview.browse.desc")}
          </p>
          <div className="flex flex-wrap gap-space-8">
            <Button asChild variant="outline" size="sm">
              <Link to="/catalog-search">
                {t("home.section.browse.catalog")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/dishes">{t("home.section.browse.dishes")}</Link>
            </Button>
          </div>
        </section>
      </main>
      <WorkspaceFooter />
    </div>
  );
}
