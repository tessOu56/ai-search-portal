import { Link } from "@remix-run/react";

import { Button } from "~/components/ui/Button";
import { useI18n } from "~/shared/i18n/context";

const STEPS = [
  {
    title: "home.step.conclusion",
    desc: "home.step.conclusion.desc",
  },
  {
    title: "home.step.sources",
    desc: "home.step.sources.desc",
  },
  {
    title: "home.step.next",
    desc: "home.step.next.desc",
  },
] as const;

/**
 * Below-fold visitor intro. One job per section, no cards.
 * Surface: marketing.
 */
export function HomeIntro() {
  const { t } = useI18n();

  return (
    <div className="border-t border-border">
      <section
        className="mx-auto w-full max-w-5xl px-space-16 py-section md:px-space-32"
        aria-labelledby="home-intro-what"
      >
        <h2
          id="home-intro-what"
          className="mb-space-8 font-display text-type-32 font-medium text-foreground"
        >
          {t("home.section.what.title")}
        </h2>
        <p className="max-w-xl text-type-16 leading-body text-muted-foreground">
          {t("home.section.what.desc")}
        </p>
      </section>

      <section
        className="mx-auto w-full max-w-5xl px-space-16 pb-section md:px-space-32"
        aria-labelledby="home-intro-how"
      >
        <h2
          id="home-intro-how"
          className="mb-space-8 font-display text-type-32 font-medium text-foreground"
        >
          {t("home.section.how.title")}
        </h2>
        <p className="mb-space-16 max-w-xl text-type-16 leading-body text-muted-foreground">
          {t("home.section.how.desc")}
        </p>
        <ol className="max-w-xl space-y-stack">
          {STEPS.map((step) => (
            <li key={step.title}>
              <p className="text-type-16 font-medium text-foreground">
                {t(step.title)}
              </p>
              <p className="text-type-14 leading-body text-muted-foreground">
                {t(step.desc)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="mx-auto w-full max-w-5xl px-space-16 pb-section md:px-space-32"
        aria-labelledby="home-intro-browse"
      >
        <h2
          id="home-intro-browse"
          className="mb-space-8 font-display text-type-32 font-medium text-foreground"
        >
          {t("home.section.browse.title")}
        </h2>
        <p className="mb-space-16 max-w-xl text-type-16 leading-body text-muted-foreground">
          {t("home.section.browse.desc")}
        </p>
        <div className="flex flex-wrap gap-space-8">
          <Button asChild variant="outline" size="sm">
            <Link to="/catalog-search">{t("home.section.browse.catalog")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/metadata">{t("home.section.browse.assets")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/dishes">{t("home.section.browse.dishes")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/?view=dashboard">{t("home.cta.dashboard")}</Link>
          </Button>
        </div>
        <p className="mt-space-16 max-w-xl text-type-14 text-muted-foreground">
          {t("footer.synthetic.hint")}
        </p>
      </section>
    </div>
  );
}
