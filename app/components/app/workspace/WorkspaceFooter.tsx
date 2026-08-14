import { Form, Link, useRouteLoaderData } from "@remix-run/react";

import { ThemeSwitcher } from "~/components/theme/ThemeSwitcher";
import { Container } from "~/components/ui/Container";
import { API_LOCALE } from "~/shared/api/paths";
import { useI18n } from "~/shared/i18n/context";

type RootData = {
  locale: string;
  version: string;
};

type WorkspaceFooterProps = {
  agentMode?: "live_llm" | "offline_fixture";
};

export function WorkspaceFooter({ agentMode }: WorkspaceFooterProps) {
  const { t } = useI18n();
  const root = useRouteLoaderData("root") as RootData | undefined;
  const locale = root?.locale ?? "zh-TW";
  const version = root?.version ?? "0.0.0";
  const year = String(new Date().getFullYear());
  const modeLabel =
    agentMode === "live_llm"
      ? t("chat.badge.live_llm")
      : agentMode
        ? t("chat.badge.offline_fixture")
        : null;

  return (
    <footer className="border-t border-border py-space-16" role="contentinfo">
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
            {t("footer.sitemap")}
          </Link>
        </p>
        {modeLabel ? <p title={t("chat.badge.sse")}>{modeLabel}</p> : null}
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
        <ThemeSwitcher
          themeLabel={t("theme.switch")}
          toLightLabel={t("theme.toLight")}
          toDarkLabel={t("theme.toDark")}
        />
      </Container>
    </footer>
  );
}
