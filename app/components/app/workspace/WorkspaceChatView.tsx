import { Form, Link, useRouteLoaderData } from "@remix-run/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { ChatInterface } from "~/components/shared/chat/ChatInterface";
import { Container } from "~/components/ui/Container";
import { API_LOCALE } from "~/shared/api/paths";
import { useI18n } from "~/shared/i18n/context";

type RootData = {
  locale: string;
  version: string;
  translations: Record<string, string>;
};

type WorkspaceChatViewProps = {
  /** When true, scroll chat into view after mount (CTA from landing). */
  focusChat?: boolean;
  /** Seed query from home ask panel; consumed once. */
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
};

/** Content layer under HomeLanding — chat + short trust line, no hero card wall. */
export function WorkspaceChatView({
  focusChat = false,
  pendingQuery = null,
  onPendingQueryConsumed,
}: WorkspaceChatViewProps) {
  const { t } = useI18n();
  const root = useRouteLoaderData("root") as RootData | undefined;
  const locale = root?.locale ?? "zh-TW";
  const version = root?.version ?? "0.0.0";
  const year = String(new Date().getFullYear());
  const reduceMotion = useReducedMotion();
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusChat) return;
    chatRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [focusChat, reduceMotion]);

  return (
    <div className="relative bg-transparent">
      <Container className="py-space-32">
        <motion.div
          ref={chatRef}
          id="home-chat"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <p className="mb-space-16 max-w-2xl text-type-14 text-muted-foreground md:text-type-16">
            {t("home.section.how.desc")}
          </p>
          <ChatInterface
            pendingQuery={pendingQuery}
            onPendingQueryConsumed={onPendingQueryConsumed}
          />
        </motion.div>
      </Container>

      <footer
        className="mt-space-16 border-t border-border py-space-16"
        role="contentinfo"
      >
        <Container className="flex flex-wrap items-center justify-center gap-space-16 text-center text-type-12 text-muted-foreground md:text-type-14">
          <p>{t("footer.copyright", { year })}</p>
          <p>
            <Link
              to="/release-notes"
              className="text-primary hover:underline"
              title={t("release-notes.footer.link")}
            >
              {t("footer.version", { version })}
            </Link>
          </p>
          <p>
            <Link to="/vitals" className="text-primary hover:underline">
              {t("footer.vitals")}
            </Link>
          </p>
          <p>
            <Link to="/site-map" className="text-primary hover:underline">
              Site map
            </Link>
          </p>
          <p title={t("footer.synthetic.hint")}>{t("footer.synthetic")}</p>
          <p title={t("footer.demo_roles.hint")}>{t("footer.demo_roles")}</p>
          <Form
            method="post"
            action={API_LOCALE}
            className="flex items-center gap-space-8"
          >
            <input type="hidden" name="next" value="/" />
            <span className="sr-only">{t("locale.switch")}</span>
            <select
              name="locale"
              defaultValue={locale}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="h-9 rounded-full border border-input bg-background px-space-16 text-type-14 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("locale.switch")}
            >
              <option value="zh-TW">{t("locale.zh-TW")}</option>
              <option value="en">{t("locale.en")}</option>
            </select>
          </Form>
        </Container>
      </footer>
    </div>
  );
}
