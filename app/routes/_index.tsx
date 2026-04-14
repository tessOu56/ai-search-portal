import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useRouteError, useSearchParams } from "@remix-run/react";

import { ErrorBoundaryFallback } from "~/components/app/errorboundary";
import {
  SaaSDemoView,
  WorkspaceChatView,
  WorkspaceViewSwitcher,
} from "~/components/app/workspace";
import { Button } from "~/components/ui/Button";
import { getLocale, getTranslations } from "~/shared/i18n";
import { t } from "~/shared/i18n/server";
import {
  buildJsonLdWebPage,
  buildJsonLdWebSite,
  buildSeoMeta,
  getCanonicalUrl,
  getOrigin,
  getSeoFromLoader,
} from "~/shared/seo";
import { getRouteErrorDisplay } from "~/shared/utils/errors";

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
  const seo = getSeoFromLoader(data);
  const metaTags = buildSeoMeta({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
    image: seo.image,
    locale: seo.locale,
    type: "website",
  });
  const jsonLdTags = seo.structuredData.map((obj) => ({
    "script:ld+json": obj,
  }));
  return [...metaTags, ...jsonLdTags];
};

export default function Index() {
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") === "saas" ? "saas" : "chat";
  const theme = view === "saas" ? "untitled" : "default";

  return (
    <div data-theme={theme}>
      <div className="border-b border-border bg-background/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hybrid workspace
            </p>
            <p className="text-sm text-muted-foreground">
              Switch between AI-first chat and SaaS-style dashboard views.
            </p>
          </div>
          <WorkspaceViewSwitcher />
        </div>
      </div>

      {view === "saas" ? <SaaSDemoView /> : <WorkspaceChatView />}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { title, message, statusCode } = getRouteErrorDisplay(error);
  return (
    <ErrorBoundaryFallback
      title={title}
      message={message}
      statusCode={statusCode}
    >
      <Button asChild>
        <Link to="/">返回首頁</Link>
      </Button>
    </ErrorBoundaryFallback>
  );
}
