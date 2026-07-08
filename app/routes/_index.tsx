import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useRouteError, useSearchParams } from "@remix-run/react";

import { ErrorBoundaryFallback } from "~/components/app/errorboundary";
import {
  DashboardView,
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
  const viewParam = searchParams.get("view");
  // `saas` 為舊參數，向後相容導向 dashboard；主題與 chat 共用（roadmap R1：同一設計語言）
  const view =
    viewParam === "dashboard" || viewParam === "saas" ? "dashboard" : "chat";

  return (
    <div>
      <div className="bg-background/80 border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hybrid workspace
            </p>
            <p className="text-sm text-muted-foreground">
              Switch between AI-first chat and the dashboard overview.
            </p>
          </div>
          <WorkspaceViewSwitcher />
        </div>
      </div>

      {view === "dashboard" ? <DashboardView /> : <WorkspaceChatView />}
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
