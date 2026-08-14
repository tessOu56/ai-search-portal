import { Link } from "@remix-run/react";
import { motion, useReducedMotion } from "motion/react";

import { HomeAskPanel } from "~/components/app/home/HomeAskPanel";
import { BrandMark } from "~/components/ui/BrandMark";
import { Button } from "~/components/ui/Button";
import { useI18n } from "~/shared/i18n/context";
import { cn } from "~/shared/utils/cn";

type HomeLandingProps = {
  className?: string;
  onAsk: (query: string) => void;
};

/**
 * First-viewport shell: brand + one line + ask panel.
 * Atmosphere glow is lifted to the page wrapper (spans into second screen).
 * Surface: marketing.
 */
export function HomeLanding({ className, onAsk }: HomeLandingProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <section
      className={cn(
        "relative isolate flex min-h-0 flex-col justify-center overflow-hidden pt-space-32 md:pt-space-32",
        className
      )}
      id="home-chat"
      aria-label={t("home.title")}
    >
      <div className="mx-auto w-full max-w-5xl px-space-16 py-space-32 md:p-space-32">
        <motion.div
          className="mb-space-16"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.02 }}
        >
          <BrandMark
            size="xl"
            mode="tilt"
            interactive
            lockup="stacked"
            wordmark={t("app.title")}
            className="text-foreground"
          />
        </motion.div>
        <motion.h1
          className="mb-space-16 max-w-3xl font-display text-type-52 font-medium text-foreground md:text-type-72"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14 }}
        >
          {t("home.title")}
        </motion.h1>
        <motion.p
          className="mb-space-32 max-w-xl text-type-16 text-muted-foreground md:text-type-20"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22 }}
        >
          {t("home.tagline")}
        </motion.p>
        <motion.div
          className="flex flex-col items-start gap-space-16"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
        >
          <HomeAskPanel onSubmit={onAsk} />
          <Button asChild variant="outline" size="lg" data-star-hot>
            <Link to="/?view=dashboard">{t("home.cta.dashboard")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
