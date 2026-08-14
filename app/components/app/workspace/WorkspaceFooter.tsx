import { Form, Link, useRouteLoaderData } from "@remix-run/react";
import { useRef } from "react";

import { ThemeSwitcher } from "~/components/theme/ThemeSwitcher";
import { Container } from "~/components/ui/Container";
import { Select } from "~/components/ui/Select";
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
  const localeFormRef = useRef<HTMLFormElement>(null);
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
          ref={localeFormRef}
          method="post"
          action={API_LOCALE}
          className="flex items-center gap-space-8"
        >
          <input type="hidden" name="next" value="/" />
          <span className="sr-only">{t("locale.switch")}</span>
          <Select
            name="locale"
            defaultValue={locale}
            options={[
              { value: "zh-TW", label: t("locale.zh-TW") },
              { value: "en", label: t("locale.en") },
            ]}
            aria-label={t("locale.switch")}
            onValueChange={() => localeFormRef.current?.requestSubmit()}
          />
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
