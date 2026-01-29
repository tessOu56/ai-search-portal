import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  Link,
  useRouteError,
  useRouteLoaderData,
} from "@remix-run/react";

import { ChatInterface } from "~/components/chat/ChatInterface";
import { ErrorBoundaryFallback } from "~/components/errorboundary";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
import { Container } from "~/components/ui/Container";
import { getLocale, getTranslations } from "~/shared/i18n";
import { useI18n } from "~/shared/i18n/context";
import { t } from "~/shared/i18n/server";
import {
  buildJsonLdWebPage,
  buildJsonLdWebSite,
  buildSeoMeta,
  getCanonicalUrl,
  getOrigin,
} from "~/shared/seo.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  const origin = getOrigin(request);
  const canonical = getCanonicalUrl(request);
  const title = t(translations, "app.title");
  const description = t(translations, "app.description");
  const ogLocale = locale.replace("-", "_");
  const image = `${origin}/og-image.png`;
  const structuredData = [
    buildJsonLdWebSite(origin, title, description),
    buildJsonLdWebPage(canonical, title, description, { inLanguage: locale }),
  ];
  return {
    title,
    description,
    canonical,
    image,
    locale: ogLocale,
    structuredData,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = (data?.title as string) ?? "AI 搜尋入口";
  const description = (data?.description as string) ?? "智能 AI 搜尋平台";
  const canonical = (data?.canonical as string) ?? "";
  const image = (data?.image as string) ?? "";
  const locale = (data?.locale as string) ?? "zh_TW";
  const structuredData =
    (data?.structuredData as Record<string, unknown>[]) ?? [];
  const metaTags = buildSeoMeta({
    title,
    description,
    canonical,
    image: image || undefined,
    locale,
    type: "website",
  });
  const jsonLdTags = structuredData.map((obj) => ({ "script:ld+json": obj }));
  return [...metaTags, ...jsonLdTags];
};

const STEPS = [
  { titleKey: "home.step.intent", descKey: "home.step.intent.desc" },
  { titleKey: "home.step.conclusion", descKey: "home.step.conclusion.desc" },
  { titleKey: "home.step.sources", descKey: "home.step.sources.desc" },
  { titleKey: "home.step.next", descKey: "home.step.next.desc" },
] as const;

export default function Index() {
  const { t } = useI18n();
  const root = useRouteLoaderData("root") as
    | { locale: string; version: string; translations: Record<string, string> }
    | undefined;
  const locale = root?.locale ?? "zh-TW";
  const version = root?.version ?? "0.0.0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-background to-brand-50">
      <Container className="py-16">
        <div className="mb-12 text-center">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <Badge>{t("home.badge.trusted")}</Badge>
            <Badge variant="secondary">{t("home.badge.lui")}</Badge>
            <Badge variant="secondary">{t("home.badge.tech")}</Badge>
          </div>
          <h1 className="mb-4 text-5xl font-bold text-foreground">
            {t("home.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t("home.tagline")}
          </p>
        </div>

        <div className="mb-12">
          <ChatInterface />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{t("home.section.how.title")}</CardTitle>
              <CardDescription>{t("home.section.how.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {STEPS.map((step) => (
                <Card key={step.titleKey} className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-base text-primary">
                      {t(step.titleKey)}
                    </CardTitle>
                    <CardDescription>{t(step.descKey)}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("home.section.trust.title")}</CardTitle>
              <CardDescription>{t("home.section.trust.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 size-2 rounded-full bg-primary"
                  aria-hidden
                />
                <p>{t("home.trust.1")}</p>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 size-2 rounded-full bg-primary"
                  aria-hidden
                />
                <p>{t("home.trust.2")}</p>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 size-2 rounded-full bg-primary"
                  aria-hidden
                />
                <p>{t("home.trust.3")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>

      <footer className="mt-16 border-t border-border py-8" role="contentinfo">
        <Container className="flex flex-wrap items-center justify-center gap-4 text-center text-sm text-muted-foreground">
          <p>{t("footer.copyright")}</p>
          <p>
            <Link
              to="/release-notes"
              className="text-primary hover:underline"
              title={t("release-notes.footer.link")}
            >
              {t("footer.version", { version })}
            </Link>
          </p>
          <Form
            method="post"
            action="/api/locale"
            className="flex items-center gap-2"
          >
            <input type="hidden" name="next" value="/" />
            <span className="sr-only">{t("locale.switch")}</span>
            <select
              name="locale"
              defaultValue={locale}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded border border-border bg-background px-2 py-1 text-foreground"
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

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorBoundaryFallback
        title={error.status === 404 ? "找不到頁面" : "發生錯誤"}
        message={
          error.status === 404
            ? "您要前往的頁面不存在。"
            : ((error.data &&
              typeof (error.data as { message?: unknown }).message === "string"
                ? (error.data as { message: string }).message
                : null) ??
              error.statusText ??
              "請稍後再試。")
        }
        statusCode={error.status}
      >
        <Button asChild>
          <Link to="/">返回首頁</Link>
        </Button>
      </ErrorBoundaryFallback>
    );
  }

  const message =
    error instanceof Error ? error.message : "發生未預期的錯誤，請稍後再試。";
  return (
    <ErrorBoundaryFallback title="出了點問題" message={message}>
      <Button asChild>
        <Link to="/">返回首頁</Link>
      </Button>
    </ErrorBoundaryFallback>
  );
}
